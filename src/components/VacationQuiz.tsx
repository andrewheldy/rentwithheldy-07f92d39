import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, Briefcase, MapPin, ArrowRight, ArrowLeft, Sparkles, RotateCcw, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useVehicles, type Vehicle } from "@/hooks/useVehicles";

type Party = "1-2" | "3-4" | "5-6" | "7+";
type Luggage = "light" | "standard" | "heavy";
type Style = "city" | "beach" | "road";

interface SizeTier {
  key: "compact" | "midsize" | "suv" | "fullsuv";
  seats: number;
}

const TIERS: Record<SizeTier["key"], SizeTier> = {
  compact: { key: "compact", seats: 4 },
  midsize: { key: "midsize", seats: 5 },
  suv: { key: "suv", seats: 5 },
  fullsuv: { key: "fullsuv", seats: 7 },
};

// Heuristic classifier — keeps logic in the frontend
const classify = (v: Vehicle): SizeTier["key"] => {
  const m = `${v.make} ${v.model}`.toLowerCase();
  // Q7 is a 3-row full-size SUV
  if (/(suburban|tahoe|expedition|yukon|sequoia|pilot|highlander|telluride|palisade|atlas|traverse|q7|navigator|escalade|armada)/.test(m)) return "fullsuv";
  if (/(q5|crv|cr-v|rav4|edge|equinox|forester|renegade|taos|tucson|escape|cherokee)/.test(m) || /suv/.test(v.description?.toLowerCase() || "")) return "suv";
  if (/(fit|soul|corolla|civic|jetta|sentra|versa)/.test(m)) return "compact";
  return "midsize";
};

const recommend = (party: Party, luggage: Luggage, style: Style): SizeTier["key"] => {
  if (party === "7+") return "fullsuv";
  if (party === "5-6") return luggage === "heavy" ? "fullsuv" : "suv";
  if (party === "3-4") {
    if (luggage === "heavy" || style === "beach" || style === "road") return "suv";
    return "midsize";
  }
  // 1-2 travelers
  if (luggage === "heavy" || style === "road") return "suv";
  if (style === "beach") return "midsize";
  return "compact";
};

const VacationQuiz = () => {
  const { t } = useTranslation("tripPlanner");
  const { data: vehicles = [], isLoading } = useVehicles();
  const [step, setStep] = useState(0);
  const [party, setParty] = useState<Party | null>(null);
  const [luggage, setLuggage] = useState<Luggage | null>(null);
  const [style, setStyle] = useState<Style | null>(null);

  const totalSteps = 3;
  const progress = step === 3 ? 100 : (step / totalSteps) * 100;

  const tierKey = useMemo(() => {
    if (!party || !luggage || !style) return null;
    return recommend(party, luggage, style);
  }, [party, luggage, style]);

  const tier = tierKey ? TIERS[tierKey] : null;

  const matches = useMemo(() => {
    if (!tierKey) return [];
    const exact = vehicles.filter((v) => classify(v) === tierKey);
    // For 7+ travelers, never downgrade — only show full-size SUVs (Suburban, Tahoe, Yukon, Atlas, etc.)
    if (tierKey === "fullsuv") return exact.slice(0, 6);
    if (exact.length >= 3) return exact.slice(0, 6);
    // widen to adjacent tiers if thin
    const order: SizeTier["key"][] = ["compact", "midsize", "suv", "fullsuv"];
    const idx = order.indexOf(tierKey);
    const nearby = vehicles.filter((v) => {
      const c = classify(v);
      return Math.abs(order.indexOf(c) - idx) <= 1;
    });
    return nearby.slice(0, 6);
  }, [vehicles, tierKey]);

  const reset = () => {
    setStep(0);
    setParty(null);
    setLuggage(null);
    setStyle(null);
  };

  const Option = ({
    active,
    onClick,
    icon: Icon,
    label,
    sub,
  }: {
    active: boolean;
    onClick: () => void;
    icon: LucideIcon;
    label: string;
    sub?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`text-start p-5 rounded-xl border-2 transition-all hover:shadow-card-hover ${
        active
          ? "border-primary bg-primary/5 shadow-tropical"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="bg-gradient-tropical w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold text-foreground">{label}</div>
          {sub && <div className="text-sm text-muted-foreground mt-1">{sub}</div>}
        </div>
      </div>
    </button>
  );

  return (
    <Card data-testid="trip-planner" className="border-none shadow-card-hover overflow-hidden">
      <CardContent className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {t("quiz.eyebrow")}
          </div>
          {step > 0 && step < 3 && (
            <span className="text-xs text-muted-foreground">
              {t("quiz.stepOf", { current: step + 1, total: totalSteps })}
            </span>
          )}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {t("quiz.title")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t("quiz.subtitle")}
        </p>

        <Progress
          value={progress}
          aria-label={t("quiz.progressLabel")}
          className="mb-8 h-2"
        />

        {/* Step 0: party size */}
        {step === 0 && (
          <div data-testid="trip-party-step">
            <h3 className="font-semibold text-lg mb-4">{t("questions.party.title")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["1-2", "3-4", "5-6", "7+"] as Party[]).map((p) => (
                <Option
                  key={p}
                  icon={Users}
                  label={t("questions.party.option", { count: p })}
                  active={party === p}
                  onClick={() => {
                    setParty(p);
                    setStep(1);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1: luggage */}
        {step === 1 && (
          <div data-testid="trip-luggage-step">
            <h3 className="font-semibold text-lg mb-4">{t("questions.luggage.title")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Option
                icon={Briefcase}
                label={t("questions.luggage.options.light.label")}
                sub={t("questions.luggage.options.light.description")}
                active={luggage === "light"}
                onClick={() => { setLuggage("light"); setStep(2); }}
              />
              <Option
                icon={Briefcase}
                label={t("questions.luggage.options.standard.label")}
                sub={t("questions.luggage.options.standard.description")}
                active={luggage === "standard"}
                onClick={() => { setLuggage("standard"); setStep(2); }}
              />
              <Option
                icon={Briefcase}
                label={t("questions.luggage.options.heavy.label")}
                sub={t("questions.luggage.options.heavy.description")}
                active={luggage === "heavy"}
                onClick={() => { setLuggage("heavy"); setStep(2); }}
              />
            </div>
          </div>
        )}

        {/* Step 2: trip style */}
        {step === 2 && (
          <div data-testid="trip-style-step">
            <h3 className="font-semibold text-lg mb-4">{t("questions.style.title")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Option
                icon={MapPin}
                label={t("questions.style.options.city.label")}
                sub={t("questions.style.options.city.description")}
                active={style === "city"}
                onClick={() => { setStyle("city"); setStep(3); }}
              />
              <Option
                icon={MapPin}
                label={t("questions.style.options.beach.label")}
                sub={t("questions.style.options.beach.description")}
                active={style === "beach"}
                onClick={() => { setStyle("beach"); setStep(3); }}
              />
              <Option
                icon={MapPin}
                label={t("questions.style.options.road.label")}
                sub={t("questions.style.options.road.description")}
                active={style === "road"}
                onClick={() => { setStyle("road"); setStep(3); }}
              />
            </div>
          </div>
        )}

        {/* Step 3: result */}
        {step === 3 && tier && (
          <div data-testid="trip-result" className="animate-fade-in">
            <div className="bg-gradient-tropical rounded-xl p-6 text-primary-foreground mb-6">
              <div className="text-xs uppercase tracking-wider font-semibold opacity-90 mb-2">
                {t("result.recommended")}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">{t(`tiers.${tier.key}.label`)}</h3>
              <p className="opacity-90 mb-4">{t(`tiers.${tier.key}.description`)}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-none">
                  <Users className="h-3 w-3" /> {t("result.fits", { seats: tier.seats })}
                </Badge>
                <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-none">
                  <Briefcase className="h-3 w-3" /> {t(`tiers.${tier.key}.bags`)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">
                {matches.length > 0 ? t("result.available") : t("result.checkFullFleet")}
              </h4>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> {t("result.startOver")}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-muted-foreground py-8 text-center">{t("result.loading")}</div>
            ) : matches.length === 0 ? (
              <p className="text-muted-foreground mb-4">
                {t("result.empty")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {matches.map((v) => (
                  <Card key={v.id} className="overflow-hidden border-none shadow-card-hover">
                    <div className="aspect-[4/3] bg-muted">
                      {v.images[0] && (
                        <img
                          src={v.images[0]}
                          alt={t("result.vehicleImageAlt", {
                            title: `${v.year} ${v.make} ${v.model}`,
                          })}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="font-semibold text-foreground">
                        <bdi dir="ltr">{v.year} {v.make} {v.model}</bdi>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("result.priceFrom")} {" "}
                        <bdi dir="ltr">${v.dailyRate}</bdi>
                        {t("result.pricePerDay")}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/book" className="flex-1">
                <Button
                  size="lg"
                  className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                >
                  {t("result.checkAvailability")} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </Button>
              </Link>
              <Link to="/fleet" className="flex-1">
                <Button size="lg" variant="outline" className="w-full">
                  {t("result.seeFullFleet")}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Back button */}
        {step > 0 && step < 3 && (
          <div className="mt-6">
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("quiz.back")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VacationQuiz;
