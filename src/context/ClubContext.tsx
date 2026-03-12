import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Club {
  id: string;
  name: string;
  description: string | null;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: string;
}

interface ClubContextType {
  activeClub: Club | null;
  myClubs: Club[];
  setActiveClub: (club: Club | null) => void;
  isLoadingClubs: boolean;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeClub, setActiveClubState] = useState<Club | null>(null);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);

  useEffect(() => {
    fetchMyClubs();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchMyClubs();
      } else {
        setMyClubs([]);
        setActiveClubState(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchMyClubs = async () => {
    setIsLoadingClubs(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setMyClubs([]);
      setActiveClubState(null);
      setIsLoadingClubs(false);
      return;
    }

    try {
      // First get the clubs the user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setMyClubs([]);
        setActiveClubState(null);
        setIsLoadingClubs(false);
        return;
      }

      const clubIds = memberData.map(m => m.club_id);

      // Then fetch the details for those clubs
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('*')
        .in('id', clubIds);

      if (clubsError) throw clubsError;

      setMyClubs(clubsData || []);
      
      // If no active club is set, or the active club is no longer in the list, set the first one
      const storedClubId = localStorage.getItem('activeClubId');
      const foundClub = clubsData?.find(c => c.id === storedClubId);

      if (foundClub) {
         setActiveClubState(foundClub);
      } else if (clubsData && clubsData.length > 0) {
         setActiveClubState(clubsData[0]);
      } else {
         setActiveClubState(null);
      }

    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setIsLoadingClubs(false);
    }
  };

  const setActiveClub = (club: Club | null) => {
    setActiveClubState(club);
    if (club) {
      localStorage.setItem('activeClubId', club.id);
    } else {
      localStorage.removeItem('activeClubId');
    }
  };

  return (
    <ClubContext.Provider value={{ activeClub, myClubs, setActiveClub, isLoadingClubs }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error("useClub must be used within a ClubProvider");
  }
  return context;
};
