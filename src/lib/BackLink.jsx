import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function BackLink({ label = "Back" }) {
  const navigate = useNavigate();
  return (
    <button className="link-btn" onClick={() => navigate(-1)}>
      ← {label}
    </button>
  );
}