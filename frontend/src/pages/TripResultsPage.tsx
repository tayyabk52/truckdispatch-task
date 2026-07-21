import { useParams } from "react-router-dom";

export default function TripResultsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Trip Results</h1>
      <p className="mt-2 text-muted-foreground">Trip ID: {id}</p>
    </div>
  );
}
