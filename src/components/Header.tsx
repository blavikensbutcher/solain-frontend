import { Button } from "@/components/ui/button";
import { Dumbbell, LogOut, Wallet, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

interface HeaderProps {
  walletPubkey: any | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

export default function Header({
  walletPubkey,
  onConnectWallet,
  onDisconnectWallet,
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState(i18n.language);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
      setLanguage(savedLanguage);
    } else {
      setLanguage(i18n.language);
    }
    setMounted(true);
  }, []);

  const handleLanguageChange = async (lng: string) => {
    await i18n.changeLanguage(lng);
    setLanguage(lng);
    localStorage.setItem("language", lng);
    setShowLangMenu(false);
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Логотип та назва */}
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-1.5 sm:p-2">
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold flex items-center">
            Solain
            <span className="hidden sm:inline-block ml-1.5">
              {t("Workout Tracker")}
            </span>
          </h1>
        </div>

        {/* Секція гаманця та мови */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Перемикач мови */}
          {mounted && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowLangMenu(!showLangMenu)}
              >
                <Globe className="h-4 w-4" />
                <span className="sr-only">{t("Language")}</span>
              </Button>
              
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-background border rounded-md shadow-lg z-50">
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-accent ${
                      language === "en" ? "bg-accent font-semibold" : ""
                    }`}
                  >
                    {t("English")}
                  </button>
                  <button
                    onClick={() => handleLanguageChange("uk")}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-accent ${
                      language === "uk" ? "bg-accent font-semibold" : ""
                    }`}
                  >
                    {t("Ukrainian")}
                  </button>
                </div>
              )}
            </div>
          )}

          {walletPubkey ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-muted/50 py-1 px-2 rounded-full border sm:border-none sm:bg-transparent sm:p-0">
              {/* Іконка гаманця для мобілки */}
              <Wallet className="w-3 h-3 sm:hidden text-muted-foreground" />
              
              <span className="text-xs sm:text-sm text-muted-foreground font-mono font-medium">
                {walletPubkey.toString().slice(0, 4)}...
                {walletPubkey.toString().slice(-4)}
              </span>

                <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:hidden text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                onClick={onDisconnectWallet}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">{t("Disconnect")}</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex"
                onClick={onDisconnectWallet}
              >
                {t("Disconnect")}
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onConnectWallet} className="text-xs sm:text-sm px-3 sm:px-4">
              {t("Connect")} <span className="hidden sm:inline ml-1">{t("Wallet")}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
