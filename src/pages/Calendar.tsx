import { CalendarDays, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useClub } from "@/context/ClubContext";

interface CalendarItem {
  id: string;
  attachment: string;
  created_at: string;
}

const Calendar = () => {
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeClub } = useClub();

  useEffect(() => {
    if (activeClub) {
      fetchCalendars();
    } else {
      setLoading(false);
    }
  }, [activeClub]);

  const fetchCalendars = async () => {
    if (!activeClub) return;

    const { data, error } = await supabase
      .from("calendar")
      .select("*")
      .eq("club_id", activeClub.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching calendars:", error);
    } else {
      setCalendars(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
          <CalendarDays className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Club Calendar</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          View upcoming events, tournaments, and club activities
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading calendars...</p>
            </CardContent>
          </Card>
        ) : calendars.length === 0 ? (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No calendars available yet. Check back for upcoming events and tournaments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {calendars.map((calendar) => (
              <Card key={calendar.id} className="shadow-card bg-gradient-card">
                <CardContent className="py-6">
                  <a
                    href={calendar.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:underline"
                  >
                    <FileText className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Calendar Document</p>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(calendar.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
