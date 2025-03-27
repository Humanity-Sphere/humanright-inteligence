import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/authContext";

const registerSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  fullName: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  role: z.string().min(1, "Rolle ist erforderlich"),
  organization: z.string().optional(),
  password: z.string()
    .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein")
    .regex(/[A-Z]/, "Das Passwort muss mindestens einen Großbuchstaben enthalten")
    .regex(/[0-9]/, "Das Passwort muss mindestens eine Zahl enthalten"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { register, error, clearError, loading } = useAuth();
  const [showFormError, setShowFormError] = useState(false);

  // Klare Standardwerte für das Formular
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      role: "user",
      organization: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setShowFormError(false);
    clearError();
    
    try {
      await register(values);
      navigate("/");
    } catch (err) {
      setShowFormError(true);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Registrieren</CardTitle>
          <CardDescription>
            Erstellen Sie ein Konto für Menschenrechtsplattform
          </CardDescription>
        </CardHeader>

        <CardContent>
          {showFormError && error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benutzername</FormLabel>
                    <FormControl>
                      <Input placeholder="Benutzername eingeben" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="E-Mail-Adresse eingeben" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vollständiger Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ihren vollständigen Namen eingeben" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rolle</FormLabel>
                    <FormControl>
                      <select 
                        className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        {...field}
                      >
                        <option value="user">Benutzer</option>
                        <option value="activist">Aktivist</option>
                        <option value="researcher">Forscher</option>
                        <option value="lawyer">Anwalt</option>
                        <option value="journalist">Journalist</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Organisation eingeben" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Passwort eingeben" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort bestätigen</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Passwort wiederholen" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registrierung läuft..." : "Registrieren"}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Oder registrieren mit
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => window.location.href = "/api/auth/google"}
              className="gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                  fill="#34A853"
                />
              </svg>
              Mit Google fortfahren
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            Bereits ein Konto?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              onClick={() => navigate("/login")}
            >
              Anmelden
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
