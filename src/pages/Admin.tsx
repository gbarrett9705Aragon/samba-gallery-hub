import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Upload } from "lucide-react";
import { format, parse } from "date-fns";
import { useClub } from "@/context/ClubContext";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const { activeClub } = useClub();
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    handicap: "",
    notes: "",
    member_type: "regular" as "regular" | "sub",
  });
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<File | null>(null);
  const [newPlayerPhotoPreview, setNewPlayerPhotoPreview] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({
    date: "",
    time: "",
    course: "",
  });
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newCalendarAttachment, setNewCalendarAttachment] = useState("");
  const [calendarFile, setCalendarFile] = useState<File | null>(null);
  
  // Edit states
  const [editPlayer, setEditPlayer] = useState<any>(null);
  const [editPlayerPhoto, setEditPlayerPhoto] = useState<File | null>(null);
  const [editPlayerPhotoPreview, setEditPlayerPhotoPreview] = useState<string | null>(null);
  const [editSession, setEditSession] = useState<any>(null);
  const [editAnnouncement, setEditAnnouncement] = useState<any>(null);
  const [editCalendar, setEditCalendar] = useState<any>(null);
  const [editCalendarFile, setEditCalendarFile] = useState<File | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (activeClub) {
      checkAdminAccess();
    }
  }, [activeClub]);

  const checkAdminAccess = async () => {
    if (!activeClub) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is an admin of the active club
      const { data: membershipData, error: membershipError } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', activeClub.id)
        .eq('user_id', user.id)
        .single();

      if (membershipError || membershipData?.role !== 'Admin') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You need admin privileges for this club to access this page.",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!activeClub) return;

    const [playersData, sessionsData, announcementsData, calendarData, invitationsData] = await Promise.all([
      supabase.from("players").select("*").eq("club_id", activeClub.id).order("first_name", { ascending: true }),
      supabase.from("sessions").select("*").eq("club_id", activeClub.id).order("date", { ascending: false }),
      supabase.from("announcements").select("*").eq("club_id", activeClub.id).order("created_at", { ascending: false }),
      supabase.from("calendar").select("*").eq("club_id", activeClub.id).order("created_at", { ascending: false }),
      supabase.from("invitations").select("*").eq("club_id", activeClub.id).order("created_at", { ascending: false }),
    ]);

    setPlayers(playersData.data || []);
    setSessions(sessionsData.data || []);
    setAnnouncements(announcementsData.data || []);
    setCalendar(calendarData.data || []);
    setInvites(invitationsData.data || []);
  };

  const handleGenerateInvite = async () => {
    if (!activeClub) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        club_id: activeClub.id,
        invited_by: user.id,
        role: 'Member'
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate invite.",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Invite link generated successfully.",
    });
    
    setIsInviteDialogOpen(false);
    loadData();

    // Copy to clipboard
    const inviteLink = `${window.location.origin}/invite/${data.token}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link Copied",
      description: "The invite link has been copied to your clipboard.",
    });
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    const { error } = await supabase.from(table as any).delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
      await loadData();
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.first_name.trim() || !newPlayer.last_name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "First name and last name are required",
      });
      return;
    }

    let photoUrl = null;

    // Upload photo if one is selected
    if (newPlayerPhoto) {
      const fileExt = newPlayerPhoto.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(fileName, newPlayerPhoto);

      if (uploadError) {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: uploadError.message,
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-photos')
        .getPublicUrl(fileName);
      
      photoUrl = publicUrl;
    }

    const playerData: any = {
      first_name: newPlayer.first_name,
      last_name: newPlayer.last_name,
      member_type: newPlayer.member_type,
    };

    if (newPlayer.email) playerData.email = newPlayer.email;
    if (newPlayer.telephone) playerData.telephone = newPlayer.telephone;
    if (newPlayer.handicap) playerData.handicap = parseFloat(newPlayer.handicap);
    if (newPlayer.notes) playerData.notes = newPlayer.notes;
    if (photoUrl) playerData.photo_url = photoUrl;

    const { error } = await supabase.from("players").insert({ ...playerData, club_id: activeClub?.id });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Player added successfully",
      });
      setNewPlayer({
        first_name: "",
        last_name: "",
        email: "",
        telephone: "",
        handicap: "",
        notes: "",
        member_type: "regular",
      });
      setNewPlayerPhoto(null);
      setNewPlayerPhotoPreview(null);
      setIsPlayerDialogOpen(false);
      await loadData();
    }
  };

  const handleAddSession = async () => {
    if (!newSession.date.trim() || !newSession.time.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Date and time are required",
      });
      return;
    }

    const { error } = await supabase.from("sessions").insert({
      date: newSession.date,
      time: newSession.time,
      course: newSession.course || "Samba Session",
      club_id: activeClub?.id
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Session added successfully",
      });
      setNewSession({
        date: "",
        time: "",
        course: "",
      });
      setIsSessionDialogOpen(false);
      await loadData();
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an announcement",
      });
      return;
    }

    const { error } = await supabase.from("announcements").insert({ notes: newAnnouncement, club_id: activeClub?.id });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Announcement added successfully",
      });
      setNewAnnouncement("");
      setIsAnnouncementDialogOpen(false);
      await loadData();
    }
  };

  const handleAddCalendar = async () => {
    if (!newCalendarAttachment.trim() && !calendarFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter calendar information or upload a file",
      });
      return;
    }

    let fileUrl = null;

    // Upload file if provided
    if (calendarFile) {
      const fileExt = calendarFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('calendar-files')
        .upload(fileName, calendarFile);

      if (uploadError) {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: uploadError.message,
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('calendar-files')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrl;
    }

    const attachmentValue = fileUrl || newCalendarAttachment;

    const { error } = await supabase.from("calendar").insert({ attachment: attachmentValue, club_id: activeClub?.id });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Calendar entry added successfully",
      });
      setNewCalendarAttachment("");
      setCalendarFile(null);
      setIsCalendarDialogOpen(false);
      await loadData();
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editPlayer) return;

    let photoUrl = editPlayer.photo_url;

    // Upload new photo if one is selected
    if (editPlayerPhoto) {
      const fileExt = editPlayerPhoto.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(fileName, editPlayerPhoto);

      if (uploadError) {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: uploadError.message,
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-photos')
        .getPublicUrl(fileName);
      
      photoUrl = publicUrl;
    }

    const { error } = await supabase
      .from("players")
      .update({
        first_name: editPlayer.first_name,
        last_name: editPlayer.last_name,
        email: editPlayer.email,
        telephone: editPlayer.telephone,
        handicap: editPlayer.handicap,
        notes: editPlayer.notes,
        photo_url: photoUrl,
        member_type: editPlayer.member_type,
      })
      .eq("id", editPlayer.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
      setEditPlayer(null);
      setEditPlayerPhoto(null);
      setEditPlayerPhotoPreview(null);
      await loadData();
    }
  };

  const handleUpdateSession = async () => {
    if (!editSession) return;

    const { error } = await supabase
      .from("sessions")
      .update({
        date: editSession.date,
        time: editSession.time,
        course: editSession.course || "Samba Session",
      })
      .eq("id", editSession.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Session updated successfully",
      });
      setEditSession(null);
      await loadData();
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncement) return;

    const { error } = await supabase
      .from("announcements")
      .update({ notes: editAnnouncement.notes })
      .eq("id", editAnnouncement.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
      setEditAnnouncement(null);
      await loadData();
    }
  };

  const handleUpdateCalendar = async () => {
    if (!editCalendar) return;

    let fileUrl = editCalendar.attachment;

    // Upload new file if provided
    if (editCalendarFile) {
      const fileExt = editCalendarFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('calendar-files')
        .upload(fileName, editCalendarFile);

      if (uploadError) {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: uploadError.message,
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('calendar-files')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrl;
    }

    const { error } = await supabase
      .from("calendar")
      .update({ attachment: fileUrl })
      .eq("id", editCalendar.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Calendar entry updated successfully",
      });
      setEditCalendar(null);
      setEditCalendarFile(null);
      await loadData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage database tables</p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-2 mb-4 bg-[#F5F0E8]">
          <TabsTrigger value="players" className="data-[state=active]:bg-[#F5F0E8] data-[state=inactive]:bg-[#F5F0E8]">Players</TabsTrigger>
          <TabsTrigger value="teetimes" className="data-[state=active]:bg-[#F5F0E8] data-[state=inactive]:bg-[#F5F0E8]">Sessions</TabsTrigger>
          <TabsTrigger value="announcements" className="data-[state=active]:bg-[#F5F0E8] data-[state=inactive]:bg-[#F5F0E8]">Announcements</TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-[#F5F0E8] data-[state=inactive]:bg-[#F5F0E8]">Calendar</TabsTrigger>
          <TabsTrigger value="invites" className="data-[state=active]:bg-[#F5F0E8] data-[state=inactive]:bg-[#F5F0E8]">Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle>Players</CardTitle>
                  <CardDescription>Manage player records</CardDescription>
                </div>
                <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Player
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Player</DialogTitle>
                      <DialogDescription>
                        Create a new player record
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="new-first-name">First Name *</Label>
                        <Input
                          id="new-first-name"
                          value={newPlayer.first_name}
                          onChange={(e) => setNewPlayer({ ...newPlayer, first_name: e.target.value })}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-last-name">Last Name *</Label>
                        <Input
                          id="new-last-name"
                          value={newPlayer.last_name}
                          onChange={(e) => setNewPlayer({ ...newPlayer, last_name: e.target.value })}
                          placeholder="Enter last name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-email">Email</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newPlayer.email}
                          onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                          placeholder="Enter email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-telephone">Telephone</Label>
                        <Input
                          id="new-telephone"
                          value={newPlayer.telephone}
                          onChange={(e) => setNewPlayer({ ...newPlayer, telephone: e.target.value })}
                          placeholder="Enter telephone"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-handicap">Handicap</Label>
                        <Input
                          id="new-handicap"
                          type="number"
                          step="0.1"
                          value={newPlayer.handicap}
                          onChange={(e) => setNewPlayer({ ...newPlayer, handicap: e.target.value })}
                          placeholder="Enter handicap"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-notes">Notes</Label>
                        <Textarea
                          id="new-notes"
                          value={newPlayer.notes}
                          onChange={(e) => setNewPlayer({ ...newPlayer, notes: e.target.value })}
                          placeholder="Enter notes"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-member-type">Member Type</Label>
                        <Select 
                          value={newPlayer.member_type} 
                          onValueChange={(value: "regular" | "sub") => setNewPlayer({ ...newPlayer, member_type: value })}
                        >
                          <SelectTrigger id="new-member-type">
                            <SelectValue placeholder="Select member type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="sub">Sub</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-photo">Photo</Label>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <Input
                              id="new-photo"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (!file.type.startsWith('image/')) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: "Please select an image file",
                                    });
                                    return;
                                  }
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: "Image size must be less than 5MB",
                                    });
                                    return;
                                  }
                                  setNewPlayerPhoto(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewPlayerPhotoPreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="cursor-pointer"
                            />
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          {newPlayerPhotoPreview && (
                            <div className="relative w-32 h-32">
                              <img
                                src={newPlayerPhotoPreview}
                                alt="Photo preview"
                                className="w-full h-full object-cover rounded-lg border"
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Max file size: 5MB. Supported formats: JPG, PNG, GIF
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddPlayer}>Add Player</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>{player.first_name} {player.last_name}</TableCell>
                      <TableCell>
                        <Badge variant={player.member_type === 'regular' ? 'default' : 'secondary'}>
                          {player.member_type === 'regular' ? 'Regular' : 'Sub'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditPlayer(player)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete("players", player.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Player Dialog */}
        <Dialog open={!!editPlayer} onOpenChange={(open) => !open && setEditPlayer(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>Update player information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={editPlayer?.first_name || ""}
                  onChange={(e) => setEditPlayer({ ...editPlayer, first_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={editPlayer?.last_name || ""}
                  onChange={(e) => setEditPlayer({ ...editPlayer, last_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editPlayer?.email || ""}
                  onChange={(e) => setEditPlayer({ ...editPlayer, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-telephone">Telephone</Label>
                <Input
                  id="edit-telephone"
                  value={editPlayer?.telephone || ""}
                  onChange={(e) => setEditPlayer({ ...editPlayer, telephone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-handicap">Handicap</Label>
                <Input
                  id="edit-handicap"
                  type="number"
                  step="0.1"
                  value={editPlayer?.handicap || ""}
                  onChange={(e) => setEditPlayer({ ...editPlayer, handicap: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editPlayer?.notes || ""}
                  onChange={(e) => setEditPlayer({ ...editPlayer, notes: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-member-type">Member Type</Label>
                <Select 
                  value={editPlayer?.member_type || "regular"} 
                  onValueChange={(value) => setEditPlayer({ ...editPlayer, member_type: value })}
                >
                  <SelectTrigger id="edit-member-type">
                    <SelectValue placeholder="Select member type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="sub">Sub</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-photo">Photo</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Input
                      id="edit-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.type.startsWith('image/')) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Please select an image file",
                            });
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Image size must be less than 5MB",
                            });
                            return;
                          }
                          setEditPlayerPhoto(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditPlayerPhotoPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {(editPlayerPhotoPreview || editPlayer?.photo_url) && (
                    <div className="relative w-32 h-32">
                      <img
                        src={editPlayerPhotoPreview || editPlayer?.photo_url}
                        alt="Player photo"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditPlayer(null);
                setEditPlayerPhoto(null);
                setEditPlayerPhotoPreview(null);
              }}>Cancel</Button>
              <Button onClick={handleUpdatePlayer}>Save and Return</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TabsContent value="teetimes" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Game Sessions</h2>
                <p className="text-muted-foreground">Manage session records</p>
              </div>
              <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Session</DialogTitle>
                    <DialogDescription>
                      Create a new session record
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new-date">Date *</Label>
                      <Input
                        id="new-date"
                        type="text"
                        value={newSession.date}
                        onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-time">Time *</Label>
                      <Input
                        id="new-time"
                        type="text"
                        value={newSession.time}
                        onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                        placeholder="--:--"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-course">Venue</Label>
                      <Input
                        id="new-course"
                        value={newSession.course}
                        onChange={(e) => setNewSession({ ...newSession, course: e.target.value })}
                        placeholder="e.g., Amenity Center, Jane's House"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddSession}>Add Session</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const timeFormatted = session.time 
                    ? (() => {
                        const [hours, minutes] = session.time.split(':');
                        const hour = parseInt(hours);
                        const period = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        return `${displayHour}:${minutes} ${period}`;
                      })()
                    : session.time;
                  
                  const dateFormatted = session.date
                    ? format(new Date(session.date + 'T00:00:00'), 'EEEE, MMM d, yyyy')
                    : session.date;
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell>{dateFormatted}</TableCell>
                      <TableCell>{timeFormatted}</TableCell>
                      <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditSession(session)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete("sessions", session.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Edit Session Dialog */}
        <Dialog open={!!editSession} onOpenChange={(open) => !open && setEditSession(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>Update session information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="text"
                  value={editSession?.date || ""}
                  onChange={(e) => setEditSession({ ...editSession, date: e.target.value })}
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="text"
                  value={editSession?.time || ""}
                  onChange={(e) => setEditSession({ ...editSession, time: e.target.value })}
                  placeholder="--:--"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-course">Venue</Label>
                <Input
                  id="edit-course"
                  value={editSession?.course || ""}
                  onChange={(e) => setEditSession({ ...editSession, course: e.target.value })}
                  placeholder="e.g., Amenity Center, Jane's House"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditSession(null)}>Cancel</Button>
              <Button onClick={handleUpdateSession}>Save and Return</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Announcements</CardTitle>
                  <CardDescription>Manage announcement records</CardDescription>
                </div>
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Announcement</DialogTitle>
                      <DialogDescription>
                        Create a new announcement for club members
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="announcement">Announcement</Label>
                        <Textarea
                          id="announcement"
                          placeholder="Enter announcement text..."
                          value={newAnnouncement}
                          onChange={(e) => setNewAnnouncement(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddAnnouncement}>Add Announcement</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>{announcement.notes}</TableCell>
                      <TableCell>{new Date(announcement.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditAnnouncement(announcement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete("announcements", announcement.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Announcement Dialog */}
        <Dialog open={!!editAnnouncement} onOpenChange={(open) => !open && setEditAnnouncement(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
              <DialogDescription>Update announcement content</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-announcement">Announcement</Label>
                <Textarea
                  id="edit-announcement"
                  value={editAnnouncement?.notes || ""}
                  onChange={(e) => setEditAnnouncement({ ...editAnnouncement, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAnnouncement(null)}>Cancel</Button>
              <Button onClick={handleUpdateAnnouncement}>Save and Return</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Club Calendar</CardTitle>
                  <CardDescription>Manage calendar entries</CardDescription>
                </div>
                <Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Calendar Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Calendar Entry</DialogTitle>
                      <DialogDescription>
                        Add a new event or entry to the club calendar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="calendar">Event Information (Text or File)</Label>
                        <Textarea
                          id="calendar"
                          placeholder="Enter event details..."
                          value={newCalendarAttachment}
                          onChange={(e) => setNewCalendarAttachment(e.target.value)}
                        />
                        <div className="text-sm text-muted-foreground">OR</div>
                        <Input
                          id="calendar-file"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setCalendarFile(e.target.files?.[0] || null)}
                        />
                        {calendarFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {calendarFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddCalendar}>Add Entry</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Information</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calendar.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.attachment?.startsWith('http') ? (
                          <a 
                            href={entry.attachment} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View File
                          </a>
                        ) : (
                          entry.attachment
                        )}
                      </TableCell>
                      <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditCalendar(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete("calendar", entry.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Club Invites</CardTitle>
                  <CardDescription>Generate links to invite users to {activeClub?.name}</CardDescription>
                </div>
                <Button onClick={handleGenerateInvite}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Invite Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token/Link</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No invites generated yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]">{invite.token}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
                                  toast({
                                    title: "Link Copied",
                                    description: "The invite link has been copied to your clipboard.",
                                  });
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{invite.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={invite.status === 'Accepted' ? 'default' : invite.status === 'Pending' ? 'secondary' : 'destructive'}
                            >
                              {invite.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(invite.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete("invitations", invite.id)}
                            >
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Calendar Dialog */}
        <Dialog open={!!editCalendar} onOpenChange={(open) => !open && setEditCalendar(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Calendar Entry</DialogTitle>
              <DialogDescription>Update calendar event information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-calendar-entry">Event Information</Label>
                <Textarea
                  id="edit-calendar-entry"
                  value={editCalendar?.attachment || ""}
                  onChange={(e) => setEditCalendar({ ...editCalendar, attachment: e.target.value })}
                  disabled={!!editCalendarFile}
                />
                <div className="text-sm text-muted-foreground">OR upload a new file</div>
                <Input
                  id="edit-calendar-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setEditCalendarFile(e.target.files?.[0] || null)}
                />
                {editCalendarFile && (
                  <p className="text-sm text-muted-foreground">
                    New file: {editCalendarFile.name}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCalendar(null)}>Cancel</Button>
              <Button onClick={handleUpdateCalendar}>Save and Return</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  );
};

export default Admin;
