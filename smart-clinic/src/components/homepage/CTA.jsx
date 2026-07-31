import { Link } from "react-router";

export default function CTA() {
  return (
    <section className="py-20 bg-primary text-primary-content">

      <div className="container mx-auto text-center">

        <h2 className="text-4xl font-bold">
          Ready to Modernize Healthcare?
        </h2>

        <p className="mt-4 mb-8">
          Join Smart Clinic today.
        </p>

        <Link to="/register" className="btn btn-neutral">
          Get Started
        </Link>

      </div>

    </section>
  );
}