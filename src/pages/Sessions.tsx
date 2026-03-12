import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, UserPlus, UserMinus, Users, ArrowLeft, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useClub } from "@/context/ClubContext";

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  handicap: number | null;
  member_type: 'regular' | 'sub';
}

interface SignupPlayer extends Player {
  subbing_for?: Player | null;
}

interface GameSession {
  id: string;
  date: string;
  time: string;
  course: string;
  created_at: string;
  signups?: SignupPlayer[];
}

interface Announcement {
  id: string;
  notes: string;
  created_at: string | null;
}

const Sessions = () => {
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [subbingForId, setSubbingForId] = useState<string>("");

  const regularMembers = players.filter(p => p.member_type === 'regular');

  const { activeClub } = useClub();

  useEffect(() => {
    if (activeClub) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeClub]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGameSessions(), fetchPlayers(), fetchAnnouncements()]);
    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    if (!activeClub) return;

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("club_id", activeClub.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
    } else {
      setAnnouncements(data || []);
    }
  };

  const fetchGameSessions = async () => {
    if (!activeClub) return;

    // Fetch game sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select("*")
      .eq("club_id", activeClub.id)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (sessionsError) {
      console.error("Error fetching game sessions:", sessionsError);
      return;
    }

    // Fetch signups with player details for all sessions
    // Use explicit foreign key to disambiguate the players relationship
    const { data: signupsData, error: signupsError } = await supabase
      .from("session_signups")
      .select(`
        session_id,
        subbing_for_player_id,
        players!session_signups_player_id_fkey (
          id,
          first_name,
          last_name,
          handicap,
          member_type
        ),
        subbing_for:players!session_signups_subbing_for_player_id_fkey (
          id,
          first_name,
          last_name,
          handicap,
          member_type
        )
      `);

    if (signupsError) {
      console.error("Error fetching signups:", signupsError);
    }

    // Combine sessions with their signups
    const sessionsWithSignups = (sessionsData || []).map((session) => ({
      ...session,
      signups: (signupsData || [])
        .filter((signup: any) => signup.session_id === session.id)
        .map((signup: any) => ({
          ...signup.players,
          subbing_for: signup.subbing_for
        }))
        .filter(Boolean),
    }));

    setGameSessions(sessionsWithSignups);
  };

  const fetchPlayers = async () => {
    if (!activeClub) return;

    const { data, error } = await supabase
      .from("players")
      .select("id, first_name, last_name, handicap, member_type")
      .eq("club_id", activeClub.id)
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Error fetching players:", error);
    } else {
      setPlayers((data || []) as Player[]);
    }
  };

  const handleSignUp = async (playerId: string, subbingForPlayerId?: string) => {
    if (!selectedSession) return;

    const insertData: any = {
      session_id: selectedSession,
      player_id: playerId,
    };

    if (subbingForPlayerId) {
      insertData.subbing_for_player_id = subbingForPlayerId;
    }

    const { error } = await supabase.from("session_signups").insert(insertData);

    if (error) {
      if (error.code === "23505") {
        toast.error("This player is already signed up for this session");
      } else {
        console.error("Error signing up:", error);
        toast.error("Failed to sign up. Please try again.");
      }
    } else {
      toast.success("Successfully signed up!");
      setDialogOpen(false);
      setSelectedPlayer(null);
      setSubbingForId("");
      fetchGameSessions();
    }
  };

  const handleRemove = async (playerId: string) => {
    if (!selectedSession) return;

    const { error } = await supabase
      .from("session_signups")
      .delete()
      .eq("session_id", sessionId)
      .eq("player_id", playerId);

    if (error) {
      console.error("Error removing signup:", error);
      toast.error("Failed to remove signup. Please try again.");
    } else {
      toast.success("Successfully removed!");
      setRemoveDialogOpen(false);
      fetchGameSessions();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">Loading game sessions...</p>
        </div>
      </div>
    );
  }

  if (!activeClub) {
    return (
      <div className="container py-8 max-w-4xl text-center">
        <h2 className="text-2xl font-bold mb-4">No Active Club</h2>
        <p className="text-muted-foreground">Please select a club or join one to view sessions.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Game Sessions</h1>
          <p className="text-muted-foreground text-lg">
            Browse available Samba sessions
          </p>
        </div>

        {announcements.length > 0 && (
          <div className="mb-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-l-2 border-primary pl-3">
                    <p className="text-sm whitespace-pre-wrap">{announcement.notes}</p>
                    {announcement.created_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-6">
          {gameSessions.length === 0 ? (
            <Card className="shadow-card bg-gradient-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No game sessions available at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            gameSessions.map((session) => (
              <Card key={session.id} className="shadow-card bg-gradient-card">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl md:text-2xl mb-2">{session.course}</CardTitle>
                        <div className="text-base">
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {session.date
                                ? format(new Date(`${session.date}T00:00:00`), 'EEEE, MMMM d, yyyy')
                                : session.date}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {session.time 
                                ? (() => {
                                    const [hours, minutes] = session.time.split(':');
                                    const hour = parseInt(hours);
                                    const period = hour >= 12 ? 'PM' : 'AM';
                                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                    return `${displayHour}:${minutes} ${period}`;
                                  })()
                                : session.time}
                            </div>
                          </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={dialogOpen && selectedSession === session.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                          setSelectedSession(null);
                          setSelectedPlayer(null);
                          setSubbingForId("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedSession(session.id);
                              setDialogOpen(true);
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Sign Up
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {selectedPlayer ? `Sign Up: ${selectedPlayer.first_name} ${selectedPlayer.last_name}` : "Select Member to Sign Up"}
                            </DialogTitle>
                            <DialogDescription>
                              {selectedPlayer 
                                ? selectedPlayer.member_type === 'sub' 
                                  ? "Select which regular member this sub is playing for"
                                  : "Confirm signup for this member"
                                : "Choose which member to sign up for this session"
                              }
                            </DialogDescription>
                          </DialogHeader>
                          
                          {!selectedPlayer ? (
                            <div className="grid gap-2 py-4 max-h-[400px] overflow-y-auto">
                              {players.map((player) => (
                                <Button
                                  key={player.id}
                                  variant="outline"
                                  onClick={() => {
                                    if (player.member_type === 'sub') {
                                      setSelectedPlayer(player);
                                    } else {
                                      handleSignUp(player.id);
                                    }
                                  }}
                                  className="justify-start"
                                >
                                  <Users className="mr-2 h-4 w-4" />
                                  {player.first_name} {player.last_name}
                                  <Badge 
                                    variant={player.member_type === 'regular' ? 'default' : 'secondary'} 
                                    className="ml-2"
                                  >
                                    {player.member_type === 'regular' ? 'Regular' : 'Sub'}
                                  </Badge>
                                  {player.handicap !== null && (
                                    <span className="ml-auto text-muted-foreground">
                                      HCP: {player.handicap}
                                    </span>
                                  )}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <div className="py-4 space-y-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedPlayer(null);
                                  setSubbingForId("");
                                }}
                                className="mb-2"
                              >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to members
                              </Button>
                              
                              <div className="space-y-2">
                                <Label htmlFor="subbing-for">Who are you subbing for? *</Label>
                                <Select value={subbingForId} onValueChange={setSubbingForId}>
                                  <SelectTrigger id="subbing-for">
                                    <SelectValue placeholder="Select a regular member" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {regularMembers.map((member) => (
                                      <SelectItem key={member.id} value={member.id}>
                                        {member.first_name} {member.last_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Button 
                                onClick={() => handleSignUp(selectedPlayer.id, subbingForId)}
                                disabled={!subbingForId}
                                className="w-full"
                              >
                                Confirm Sign Up
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog open={removeDialogOpen && selectedSession === session.id} onOpenChange={(open) => {
                        setRemoveDialogOpen(open);
                        if (!open) setSelectedSession(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSession(session.id);
                              setRemoveDialogOpen(true);
                            }}
                            disabled={!session.signups || session.signups.length === 0}
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select Member to Remove</DialogTitle>
                            <DialogDescription>
                              Choose which member to remove from this session
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-2 py-4 max-h-[400px] overflow-y-auto">
                            {session.signups?.map((player) => (
                              <Button
                                key={player.id}
                                variant="outline"
                                onClick={() => handleRemove(player.id)}
                                className="justify-start"
                              >
                                <Users className="mr-2 h-4 w-4" />
                                {player.first_name} {player.last_name}
                                {player.handicap !== null && (
                                  <span className="ml-auto text-muted-foreground">
                                    HCP: {player.handicap}
                                  </span>
                                )}
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                {session.signups && session.signups.length > 0 && (
                  <CardContent>
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        Signed Up Members ({session.signups.length})
                      </h3>
                      <div className="grid gap-1">
                        {session.signups.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-1.5 rounded-md bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {player.first_name} {player.last_name}
                              </span>
                              {player.member_type === 'sub' && player.subbing_for && (
                                <span className="text-xs text-muted-foreground">
                                  (subbing for {player.subbing_for.first_name} {player.subbing_for.last_name})
                                </span>
                              )}
                            </div>
                            {player.handicap !== null && (
                              <span className="text-sm text-muted-foreground">
                                HCP: {player.handicap}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sessions;
