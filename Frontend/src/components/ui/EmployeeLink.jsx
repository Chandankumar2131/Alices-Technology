import { Link } from "react-router-dom";
import { fullName } from "../../utils/helpers";

export default function EmployeeLink({ employee }) {
  if (!employee) return <span>—</span>;
  const id = employee._id || employee.id;
  return (
    <Link to={`/employees/${id}`} className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline">
      {fullName(employee)}
    </Link>
  );
}
