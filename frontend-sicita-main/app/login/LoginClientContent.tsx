// app/login/LoginClientContent.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
// ▼▼▼ Impor untuk Logo dan Tema ▼▼▼
import Image from "next/image";
import { useTheme } from "next-themes";
// ---
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// SVG Ikon Google untuk tombol (tidak berubah)
const GoogleIcon = () => (
  <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    />
  </svg>
);

export default function LoginClientContent() {
  // ▼▼▼ Dapatkan tema saat ini ▼▼▼
  const { resolvedTheme } = useTheme();
  // ---
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  // Semua state dan logika Anda tidak berubah
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // useEffect dan handlers lainnya tidak berubah...
  useEffect(() => {
    const errorCodeFromUrl = searchParams?.get("error");
    if (!errorCodeFromUrl) return;

    let decodedMsg = "";
    try {
      decodedMsg = decodeURIComponent(errorCodeFromUrl);
    } catch {
      decodedMsg = errorCodeFromUrl;
    }

    if (decodedMsg === "CredentialsSignin") {
      setError("Email/username atau password salah.");
    } else if (
      decodedMsg.toUpperCase().includes("OAUTH") ||
      decodedMsg.toUpperCase().includes("GOOGLE") ||
      decodedMsg === "Callback" ||
      decodedMsg === "OAuthAccountNotLinked"
    ) {
      setError(
        "Login dengan Google gagal. Akun mungkin belum terdaftar atau ada masalah dengan penyedia."
      );
    } else if (decodedMsg) {
      setError(`Error: ${decodedMsg}`);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      emailOrUsername,
      password,
    });

    setIsLoading(false);

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        setError(
          "Kombinasi email/username dan password salah. Silakan periksa kembali."
        );
      } else {
        setError(`Login gagal: ${result.error}`);
      }
    } else if (result?.ok) {
      router.push(callbackUrl);
    } else {
      setError(
        "Login gagal karena kesalahan yang tidak diketahui. Silakan coba lagi."
      );
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    await signIn("google", { callbackUrl });
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* ▼▼▼ Bagian Logo ▼▼▼ */}
        <div className="flex justify-center">
          <Link href="/">
            {/* PENTING: Ganti nama file logo dan ukurannya sesuai kebutuhan Anda */}
            {/* Logo untuk Light Mode */}
            <Image
              src="/logo-light.png" // Asumsi logo light mode
              alt="Logo Aplikasi"
              width={150} // Sesuaikan lebar logo Anda
              height={50} // Sesuaikan tinggi logo Anda
              className="block dark:hidden" // Tampil di light mode, sembunyi di dark mode
              priority
            />
            {/* Logo untuk Dark Mode */}
            <Image
              src="/logo-dark.png" // Asumsi logo dark mode
              alt="Logo Aplikasi"
              width={150} // Sesuaikan lebar logo Anda
              height={50} // Sesuaikan tinggi logo Anda
              className="hidden dark:block" // Sembunyi di light mode, tampil di dark mode
              priority
            />
          </Link>
        </div>
        {/* ▲▲▲ SAMPAI SINI ▲▲▲ */}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
            <CardDescription>
              Login dengan kredensial atau akun Google Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Penanganan error dari kode pertama */}
            {error && (
              <div className="mb-4 text-sm text-center text-destructive-foreground bg-destructive/20 p-3 rounded-md border border-destructive/30">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-4 mb-4">
              <Button
                className="w-full bg-muted-foreground text-muted hover:text-muted/80"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Lanjutkan dengan Google
              </Button>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Atau lanjutkan dengan
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="emailOrUsername">Email atau Username</Label>
                  <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder="email@contoh.com atau username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    autoComplete="username"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password" // Arahkan ke halaman lupa password
                      className="ml-auto inline-block text-sm underline"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Login
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Belum punya akun?{" "}
                <Link href="/register" className="underline">
                  Daftar
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-muted-foreground text-center text-xs text-balance">
          Dengan melanjutkan, Anda setuju pada{" "}
          <Link href="/terms" className="underline">
            Ketentuan Layanan
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" className="underline">
            Kebijakan Privasi
          </Link>{" "}
          kami.
        </div>
      </div>
    </main>
  );
}
