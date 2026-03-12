import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const AddSession = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    course: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time) {
      toast.error("Please fill in date and time");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("sessions").insert({
      date: formData.date,
      time: formData.time,
      course: formData.course || "Samba Session",
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error adding session:", error);
      toast.error("Failed to add session. Please try again.");
    } else {
      toast.success("Session added successfully!");
      navigate("/");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Calendar className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Add New Session</h1>
          <p className="text-muted-foreground text-lg">
            Schedule a new Samba session for the club
          </p>
        </div>

        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>
              Enter the date, time, and venue information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Venue</Label>
                <Input
                  id="course"
                  name="course"
                  type="text"
                  placeholder="e.g., Amenity Center, Jane's House"
                  value={formData.course}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Session"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddSession;
