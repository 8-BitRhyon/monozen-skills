#!/usr/bin/env python3
"""Cross-check: run the REAL llm-verifier Python package against a mock
OpenAI-compatible logprob server and assert it agrees with the Node
reference CLI (scripts/llm-verifier.mjs) on identical responses.

This is an OPT-IN, non-CI verification (it needs the real package):

    python3 -m venv /tmp/llmv-venv
    /tmp/llmv-venv/bin/pip install llm-verifier
    /tmp/llmv-venv/bin/python scripts/verifier-crosscheck.py

The mock serves:
  GET  /v1/models           -> model discovery (the package queries this)
  POST /v1/chat/completions -> analysis call, then per-tag prefill calls
The package's prefill flow: it first asks for analysis; when the response
has no <score_X> tags it continues the assistant message per tag and reads
the letter distribution at that position. The mock serves deterministic
letters driven by the same markers the Node functional tests use
(VSCORE=<0..1> per slot, v = 1 + round(q*19), A best / T worst) so the two
implementations must agree on identical responses.
"""

import http.server
import json
import os
import re
import threading

LETTERS = 'ABCDEFGHIJKLMNOPQRST'


def reward_letter(q):
    v = 1 + round(q * 19)
    return LETTERS[20 - v]


def find_marker(text, slot):
    """Extract VSCORE for the requested slot from a pairwise prompt."""
    parts = text.split('**Trajectory B:**', 1)
    a_part = parts[0]
    b_part = parts[1] if len(parts) > 1 else ''
    target = b_part if slot == 'B' else a_part
    m = re.search(r'VSCORE=([0-9.]+)', target)
    return float(m.group(1)) if m else 0.5


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        data = json.dumps({'object': 'list', 'data': [{'id': 'mock-served-model'}]}).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        try:
            payload = json.loads(body or b'{}')
        except Exception:
            payload = {}
        messages = payload.get('messages') or []

        # Prefill call? The last message is an assistant continuation whose
        # content ends with the tag being scored.
        slot = None
        if messages:
            last_content = messages[-1].get('content', '') or ''
            if last_content.rstrip().endswith('<score_A>'):
                slot = 'A'
            elif last_content.rstrip().endswith('<score_B>'):
                slot = 'B'

        if slot is not None:
            user_prompt = messages[0].get('content', '') or ''
            q = find_marker(user_prompt, slot)
            token = reward_letter(q)
            content = token
            top = [{'token': token, 'logprob': 0.0, 'bytes': None}]
        else:
            # Analysis call: tag-less text, so the package runs the prefill.
            content = 'The agent appears to be on a reasonable path.'
            token = 'A'
            top = [{'token': content, 'logprob': 0.0, 'bytes': None}]

        resp = {
            'id': 'chatcmpl-mock', 'object': 'chat.completion', 'created': 1,
            'model': payload.get('model', 'mock'),
            'choices': [{
                'index': 0,
                'message': {'role': 'assistant', 'content': content},
                'finish_reason': 'stop',
                'logprobs': {
                    'content': [{'token': token, 'logprob': top[0]['logprob'],
                                 'bytes': None, 'top_logprobs': top}]
                }
            }]
        }
        data = json.dumps(resp).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):  # silence
        pass


server = http.server.HTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
port = server.server_address[1]
os.environ['OPENAI_BASE_URL'] = 'http://127.0.0.1:%d/v1' % port
os.environ['OPENAI_API_KEY'] = 'test-key'

import llm_verifier  # noqa: E402

problem = 'Reverse a string.'
candidates = [
    'Candidate a\nVSCORE=0.9',
    'Candidate b\nVSCORE=0.7',
    'Candidate c\nVSCORE=0.5',
    'Candidate d\nVSCORE=0.3',
    'Candidate e\nVSCORE=0.1',
]

result = llm_verifier.select(
    problem=problem,
    candidates=candidates,
    criteria={'Correctness': 'Does the code actually reverse the string?'},
    n_evaluations=1,
    pivots=2,
    seed=0,
)
print('PYTHON select: best index=%d scores=%s' % (result.index, result.scores))
assert result.index == 0, 'Python must select candidate a (VSCORE=0.9)'
assert result.scores[0] == max(result.scores), \
    'Python winner must have the top mean preference'
assert result.scores[0] > 0.55, \
    'Python winner mean preference should be clearly > 0.5, got %s' % result.scores[0]
assert result.scores[0] > result.scores[-1], \
    'Python ranking must place the 0.9 candidate above the 0.1 candidate'

ra, rb = llm_verifier.compare(
    problem,
    candidates[0], candidates[1],
    criteria={'Correctness': 'Does the code actually reverse the string?'},
    n_evaluations=1,
)
# candidates[0] has VSCORE=0.9 (17/19), candidates[1] has VSCORE=0.7 (13/19)
print('PYTHON compare: ra=%.4f rb=%.4f (expect ~0.895, ~0.684)' % (ra, rb))
assert abs(ra - 17 / 19) < 0.02, \
    'compare ra mismatch: %s (expect 17/19)' % ra
assert abs(rb - 13 / 19) < 0.02, \
    'compare rb mismatch: %s (expect 13/19)' % rb
assert ra > rb, 'compare must prefer the higher-VSCORE candidate'

print('CROSS-CHECK PASS: Python package agrees with the Node CLI semantics')
