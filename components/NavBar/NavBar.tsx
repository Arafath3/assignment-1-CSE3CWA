import { ModeToggle } from "../ModeToggle/ModeToggle";
import Link from "next/link";
import { IoMenu } from "react-icons/io5";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavBar = () => {
  return (
    <div className="flex justify-between p-6">
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger>
            {" "}
            <IoMenu className="text-4xl" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="ml-4">
            <DropdownMenuItem>
              <Link href={"/"}>Home</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={"/about"}>About</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Escape Room</DropdownMenuItem>
            <DropdownMenuItem>Coding Races</DropdownMenuItem>
            <DropdownMenuItem>Court Room</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <h1 className="ml-3 text-xl">22035298</h1>
      </div>
      <div>
        <ModeToggle />
      </div>
    </div>
  );
};

export default NavBar;
