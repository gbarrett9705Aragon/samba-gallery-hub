import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useClub } from "@/context/ClubContext";

interface Announcement {
  id: string;
  notes: string;
  created_at: string;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeClub } = useClub();

  useEffect(() => {
    if (activeClub) {
      fetchAnnouncements();
    } else {
      setLoading(false);
    }
  }, [activeClub]);

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
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
          <Bell className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Special Announcements</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Stay updated with the latest club news and important notices
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading announcements...</p>
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No announcements at this time. Check back later for updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="shadow-card bg-gradient-card">
                <CardContent className="py-6">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{announcement.notes}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Posted {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
