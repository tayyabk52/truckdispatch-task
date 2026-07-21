import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">Trip not found.</p>
      <Link to="/" className="mt-6 inline-block text-primary underline">
        Start a new trip
      </Link>
    </div>
  );
}
