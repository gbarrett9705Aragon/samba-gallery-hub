import { Link } from "react-router-dom";
import { CircleDot, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClub } from "@/context/ClubContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { activeClub, myClubs, setActiveClub } = useClub();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-hero shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <CircleDot className="h-8 w-8 text-primary-foreground" />
                <span className="text-xl font-bold text-primary-foreground">Samba</span>
              </Link>
              
              {activeClub && myClubs.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 px-2">
                      <span className="truncate max-w-[150px]">{activeClub.name}</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>My Clubs</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {myClubs.map((club) => (
                      <DropdownMenuItem 
                        key={club.id}
                        onClick={() => setActiveClub(club)}
                        className={activeClub.id === club.id ? "bg-accent" : ""}
                      >
                        {club.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <Button asChild variant="secondary" size="sm">
              <Link to="/more" className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                More
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="bg-muted py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">© 2025 Samba. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
