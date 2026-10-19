import { Button } from "@/components/ui/button";
import { Calendar, UserPlus, Users, Trophy, Bell, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/samba-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Samba Card Game"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to Samba</h1>
          <p className="text-xl md:text-2xl mb-2 opacity-90">
            1st &amp; 3rd Mondays @ 10am
          </p>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Join our community of passionate card players and reserve your game sessions today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="hero">
              <Link to="/">
                <Calendar className="h-5 w-5" />
                View Game Sessions
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/join">
                <UserPlus className="h-5 w-5" />
                Become a Member
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Join Samba?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the best card game community with easy session booking and member benefits
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card p-8 rounded-lg shadow-card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Premium Experience</h3>
            <p className="text-muted-foreground">
              Enjoy our well-organized game sessions with fellow enthusiasts
            </p>
          </div>

          <div className="bg-card p-8 rounded-lg shadow-card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Calendar className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Session Management</h3>
            <p className="text-muted-foreground">
              Easy online booking system for all your game sessions
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-lg shadow-card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Users className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Vibrant Community</h3>
            <p className="text-muted-foreground">
              Connect with fellow Samba enthusiasts and build lasting friendships
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-lg shadow-card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Bell className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Stay Updated</h3>
            <p className="text-muted-foreground">
              Get notified about events, tournaments, and club announcements
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Samba Club</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Become a member and enjoy exclusive access to our game sessions and events
          </p>
          <Button asChild size="lg">
            <Link to="/join">
              <UserPlus className="h-5 w-5" />
              Apply for Membership
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
