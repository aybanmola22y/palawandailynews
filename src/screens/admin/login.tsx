"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const authError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    authError === "unauthorized"
      ? "You do not have permission to access the admin dashboard."
      : null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function valuesFromForm(
    values: LoginValues,
    formEl?: HTMLFormElement | null,
  ): LoginValues {
    if (!formEl) return values;
    const data = new FormData(formEl);
    return {
      email: String(data.get("email") ?? values.email).trim(),
      password: String(data.get("password") ?? values.password).trim(),
    };
  }

  const submitting = form.formState.isSubmitting;

  async function onSubmit(
    values: LoginValues,
    formEl?: HTMLFormElement | null,
  ) {
    setError(null);
    form.clearErrors();

    const payload = valuesFromForm(values, formEl);
    form.setValue("email", payload.email, { shouldValidate: true });
    form.setValue("password", payload.password, { shouldValidate: true });

    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "email" || path === "password") {
          form.setError(path, { message: issue.message });
        }
      }
      return;
    }

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed.data),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        form.clearErrors();
        setError(data.error ?? "Unable to sign in. Please try again.");
        return;
      }

      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F3] dark:bg-[#0A0A09] px-4 py-12">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-block font-serif text-2xl font-bold text-foreground hover:text-primary transition-colors"
          >
            Palawan Daily News
          </Link>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Admin sign in
          </p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="font-serif text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-balance">
              Sign in to manage articles, ads, and team settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit((values) =>
                    onSubmit(values, event.currentTarget),
                  )();
                }}
                className="space-y-4"
              >
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-foreground font-medium">Email</Label>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@palawandaily.com"
                          {...field}
                          name="email"
                          onChange={(e) => {
                            field.onChange(e);
                            if (error) setError(null);
                          }}
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
                      <Label className="text-foreground font-medium">Password</Label>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            className="pr-10"
                            {...field}
                            name="password"
                            onChange={(e) => {
                              field.onChange(e);
                              if (error) setError(null);
                              form.clearErrors("password");
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            className="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#C41E3A] hover:bg-[#a81830] text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col border-t pt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="text-foreground underline-offset-4 hover:underline"
            >
              ← Back to the site
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
