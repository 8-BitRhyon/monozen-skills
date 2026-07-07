vim.g.mapleader = " "

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({ "git", "clone", "--filter=blob:none", "https://github.com/folke/lazy.nvim.git", lazypath })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  { "catppuccin/nvim", name = "catppuccin", priority = 1000, config = function() vim.cmd.colorscheme("catppuccin-mocha") end },
  { "nvim-treesitter/nvim-treesitter", build = ":TSUpdate", config = function() require("nvim-treesitter.configs").setup({ ensure_installed = { "lua", "markdown", "yaml", "toml", "json" }, auto_install = true, highlight = { enable = true } }) end },
  { "nvim-telescope/telescope.nvim", dependencies = { "nvim-lua/plenary.nvim", "nvim-telescope/telescope-fzf-native.nvim", build = "make" }, config = function() local builtin = require("telescope.builtin"); vim.keymap.set("n", "<leader>ff", builtin.find_files, {}); vim.keymap.set("n", "<leader>fg", builtin.live_grep, {}); vim.keymap.set("n", "<leader>fb", builtin.buffers, {}) end },
  { "neovim/nvim-lspconfig", config = function() vim.api.nvim_create_autocmd("LspAttach", { group = vim.api.nvim_create_augroup("UserLspConfig", {}), callback = function(ev) vim.keymap.set("n", "gd", vim.lsp.buf.definition, { buffer = ev.buf }); vim.keymap.set("n", "K", vim.lsp.buf.hover, { buffer = ev.buf }); vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, { buffer = ev.buf }) end }) end },
})

vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true
vim.opt.termguicolors = true
