import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useClub } from "@/context/ClubContext";

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setActiveClub } = useClub();
  
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [clubData, setClubData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkInvite();
  }, [token]);

  const checkInvite = async () => {
    if (!token) {
      navigate("/");
      return;
    }

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch invite details
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (inviteError || !invite) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setInviteData(invite);

      if (invite.status !== 'Pending') {
         toast({
          title: "Invitation Used",
          description: "This invitation has already been used.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      // Fetch club details
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', invite.club_id)
        .single();

      if (clubError || !club) {
        toast({
          title: "Club not found",
          description: "The club for this invitation no longer exists.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setClubData(club);

    } catch (error) {
      console.error("Error checking invite:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user || !inviteData || !clubData) return;
    setLoading(true);

    try {
      // 1. Add user to club_members
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubData.id,
          user_id: user.id,
          role: inviteData.role
        });

      if (memberError && memberError.code !== '23505') { // Ignore duplicate key errors if already joined
        throw memberError;
      }

      // 2. Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'Accepted' })
        .eq('id', inviteData.id);

      if (updateError) throw updateError;

      // 3. Set active club
      setActiveClub(clubData);
      
      toast({
        title: "Success!",
        description: `You have joined ${clubData.name}.`,
      });

      // Redirect to home (which will now show sessions for this club)
      navigate("/");

    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Error",
        description: "Failed to join the club. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inviteData || !clubData) {
    return null; // Handled by redirects in checkInvite
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Club Invitation</CardTitle>
          <CardDescription>
            You have been invited to join <strong>{clubData.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <span className="text-3xl">🎉</span>
          </div>
          <p className="text-muted-foreground mb-4">
            Join the community to view sessions, announcements, and connect with other members.
          </p>

          {!user && (
            <div className="bg-muted p-4 rounded-lg text-sm mb-4">
              <p>You need to sign in or create an account to accept this invitation.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {user ? (
            <Button className="w-full" size="lg" onClick={handleAcceptInvite}>
              Accept Invitation & Join Club
            </Button>
          ) : (
            <Button 
              className="w-full" 
              size="lg" 
              onClick={() => {
                // Store intended destination
                localStorage.setItem('redirectAfterLogin', `/invite/${token}`);
                navigate('/auth');
              }}
            >
              Sign In to Join
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            Decline
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Invite;
