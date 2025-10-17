import { useEffect, useState } from "react";
import api from "../api/client";

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/hello")
      .then(response => setData(response.data))
      .catch(error => console.error("Erreur API:", error));
  }, []);

  return (
    <div>
      <h1>Frontend OrientMada 🚀</h1>
      {data ? (
        <p>{data.message}</p>
      ) : (
        <p>Chargement...</p>
      )}
    </div>
  );
}
