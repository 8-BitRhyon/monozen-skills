export function CheckoutForm() {
  return (
    <form>
      <button onClick={submit}>
        <CartIcon />
      </button>
      <input type="email" placeholder="Email" />
      <div onClick={applyCoupon}>Apply coupon</div>
      <img src="/receipt.png" />
      <p style={{ transition: "all 200ms" }}>Total</p>
    </form>
  );
}
