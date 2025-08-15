import { useConexion } from "../Hooks/useConexion.js";

function IndicadorConexion() {
  const online = useConexion();

  return (
    <div>
      <span
        style={{
          color: online ? "green" : "red",
          fontWeight: "bold"
        }}
      >
        {online ? "En línea" : "Offline"}
      </span>
    </div>
  );
}
