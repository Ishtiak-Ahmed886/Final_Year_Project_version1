export default function Footer() {
  return (
    <footer className="footer footer-center p-10 bg-base-300">
      <aside>
        <p className="font-bold text-lg">
          Smart Clinic
        </p>

        <p>
          Connecting clinics and patients with
          modern healthcare technology.
        </p>

        <p>
          © {new Date().getFullYear()} Smart Clinic
        </p>
      </aside>
    </footer>
  );
}