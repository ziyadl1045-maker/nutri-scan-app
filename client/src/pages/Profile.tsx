import { useForm } from "react-hook-form";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  age: z.coerce.number().min(0).max(120),
  gender: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { profile, updateProfile, isUpdating, isLoading } = useProfile();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      age: 0,
      gender: "",
    },
    values: profile ? {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      age: profile.age || 0, // Using age if added to schema extension on backend, otherwise handling gracefully
      gender: profile.gender || "",
    } : undefined
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile(data, {
      onSuccess: () => {
        toast({
          title: "Profile updated",
          description: "Your information has been saved.",
        });
      },
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-6 py-12 pb-16 rounded-b-[2.5rem] shadow-sm text-center">
        <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full mb-4 overflow-hidden border-4 border-white shadow-lg">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-emerald-700">
              {user?.firstName?.[0]}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{user?.firstName} {user?.lastName}</h1>
        <p className="text-muted-foreground">{user?.email}</p>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-8">
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">First Name</label>
                <input 
                  {...form.register("firstName")}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Last Name</label>
                <input 
                  {...form.register("lastName")}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Age</label>
                <input 
                  type="number"
                  {...form.register("age")}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <select 
                  {...form.register("gender")}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isUpdating}
              className="w-full py-4 mt-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button 
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500 font-medium hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
