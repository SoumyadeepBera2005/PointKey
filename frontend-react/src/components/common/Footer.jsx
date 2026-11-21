export default function Footer() {
  return (
    <footer className="border-t border-beige-border bg-beige py-6 text-center text-xs text-navy/70">
      <p className="font-bold text-navy">pRent — Find Your Place. Rent with Trust.</p>
      <p className="mt-1">Verified owners · 100% refund guarantee · Privacy-first listings</p>
      <p className="mt-1">© {new Date().getFullYear()} pRent. All rights reserved.</p>
    </footer>
  );
}
