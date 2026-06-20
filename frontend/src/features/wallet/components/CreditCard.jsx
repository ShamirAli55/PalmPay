export default function CreditCard() {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 p-6 text-white">
      <div className="mb-10 flex justify-between">
        <span>Digital Palm</span>
        <span>PLATINUM</span>
      </div>

      <h2 className="mb-6 text-3xl font-bold">
        Rs. 12,450.00
      </h2>

      <p>**** **** **** 8829</p>
    </div>
  );
}