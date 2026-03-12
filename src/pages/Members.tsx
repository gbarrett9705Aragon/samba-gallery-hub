import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useClub } from "@/context/ClubContext";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  telephone: string | null;
  handicap: number | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeClub } = useClub();

  useEffect(() => {
    if (activeClub) {
      fetchMembers();
    } else {
      setLoading(false);
    }
  }, [activeClub]);

  const fetchMembers = async () => {
    if (!activeClub) return;

    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("club_id", activeClub.id)
      .order("first_name", { ascending: true });

  if (error) {
    console.error("Error fetching members:", error);
  } else {
    console.log("[Members] fetched players:", data?.length, "with photos:", data?.filter((m: any) => m.photo_url)?.length);
    if (data && data.length) {
      const sampleWithPhoto = (data as any[]).find((m) => m.photo_url);
      console.log("[Members] sample photo_url:", sampleWithPhoto?.photo_url);
    }
    setMembers(data || []);
  }
  setLoading(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">Loading members...</p>
        </div>
      </div>
    );
  }

  if (!activeClub) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Club Members</h1>
          <p className="text-muted-foreground text-lg">
            Meet our wonderful Samba community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No members yet. Be the first to join!</p>
            </div>
          ) : (
            members.map((member) => (
              <Card key={member.id} className="shadow-card bg-gradient-card overflow-hidden transition-smooth hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-0">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img
                    src={member.photo_url ? `${member.photo_url}?t=${Date.now()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.first_name}`}
                    alt={`${member.first_name} ${member.last_name}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.error(`[Members] Failed to load photo for ${member.first_name}:`, member.photo_url);
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.first_name}`;
                    }}
                  />
                </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">
                      {member.first_name} {member.last_name}
                    </h3>
                    {member.handicap !== null && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Handicap: {member.handicap}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(member.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;
