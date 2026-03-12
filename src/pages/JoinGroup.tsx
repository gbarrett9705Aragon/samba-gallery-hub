import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneNumber } from "@/lib/utils";
import { useClub } from "@/context/ClubContext";

const JoinGroup = () => {
  const { activeClub } = useClub();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    telephone: "",
    email: "",
    handicap: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim values and validate
    const trimmedData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      telephone: formData.telephone.trim(),
      email: formData.email.trim(),
    };
    
    if (!trimmedData.firstName || !trimmedData.lastName || !trimmedData.telephone || !trimmedData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    let photoUrl = null;

    // Upload photo if one is selected
    if (photo) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('player-photos')
        .upload(fileName, photo);

      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        toast.error("Failed to upload photo. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-photos')
        .getPublicUrl(fileName);
      
      photoUrl = publicUrl;
    }

    const { error } = await supabase.from("players").insert({
      first_name: trimmedData.firstName,
      last_name: trimmedData.lastName,
      telephone: trimmedData.telephone,
      email: trimmedData.email,
      handicap: formData.handicap ? parseFloat(formData.handicap) : null,
      photo_url: photoUrl,
      club_id: activeClub?.id
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to submit application. Please try again.");
    } else {
      toast.success("Welcome to the golf club! Your application has been submitted.");
      setFormData({
        firstName: "",
        lastName: "",
        telephone: "",
        email: "",
        handicap: "",
      });
      setPhoto(null);
      setPhotoPreview(null);
      // Navigate to home page after successful submission
      setTimeout(() => navigate("/"), 1500);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "telephone") {
      // Remove all non-numeric characters
      const cleaned = value.replace(/\D/g, '');
      // Limit to 10 digits
      const limited = cleaned.slice(0, 10);
      // Format and set
      setFormData((prev) => ({
        ...prev,
        telephone: formatPhoneNumber(limited),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      
      setPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <UserPlus className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Join Our Golf Club</h1>
          <p className="text-muted-foreground text-lg">
            Become a member and enjoy exclusive access to our tee times and events
          </p>
        </div>

        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle>Membership Application</CardTitle>
            <CardDescription>
              Fill out the form below to join our golf community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone Number *</Label>
                <Input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.telephone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.smith@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handicap">Handicap (Optional)</Label>
                <Input
                  id="handicap"
                  name="handicap"
                  type="number"
                  step="0.1"
                  placeholder="12.5"
                  value={formData.handicap}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Photo (Optional)</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {photoPreview && (
                    <div className="relative w-32 h-32">
                      <img
                        src={photoPreview}
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

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By submitting this form, you agree to our terms and conditions. 
            We'll contact you within 48 hours to complete your membership.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;
