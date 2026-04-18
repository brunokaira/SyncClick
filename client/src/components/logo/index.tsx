import {ClipboardList} from "lucide-react";
import { Link } from "react-router-dom";

const Logo = (props: { url?: string }) => {
  const { url = "/" } = props;
  return (
    <div className="flex items-center justify-center sm:justify-start">
      <Link to={url}>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ClipboardList className="size-5 h-6 w-6" />
        </div>
      </Link>
    </div>
  );
};

export default Logo;
