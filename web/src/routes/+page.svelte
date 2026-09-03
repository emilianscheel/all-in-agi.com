<script lang="ts">
    import { onMount, tick } from "svelte";
    import { animate } from "motion";
    import {
        Blend,
        Bot,
        CalendarDays,
        CalendarClock,
        Camera,
        Cookie,
        GraduationCap,
        Globe2,
        Image,
        Languages,
        Lightbulb,
        Mail,
        MapPin,
        MessageCircle,
        MicVocal,
        Monitor,
        Network,
        PenTool,
        Phone,
        Pizza,
        Presentation,
        Projector,
        ShieldCheck,
        Speech,
        Target,
        Trophy,
        UserRoundCheck,
        Users,
        UsersRound,
        Video,
        Vote,
    } from "lucide-svelte";
    import { Accordion } from "bits-ui";
    import { CODING_TOOLS } from "$lib/booking";
    import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "$lib/contact";
    import { reveal } from "$lib/motion";
    import SeoHead from "$lib/SeoHead.svelte";
    import JsonLd from "$lib/JsonLd.svelte";
    import ClosingCta from "$lib/ClosingCta.svelte";

    const carouselTools = CODING_TOOLS.filter((tool) => tool.icon);
    const carouselRepeats = [0, 1, 2, 3];
    const carouselLabel = `Coding Tools im Hackathon: ${carouselTools.map((tool) => tool.label).join(", ")}`;
    const customFormatUrl = "https://cal.com/emilian.scheel/hackathon-vorbereitung";

    const formatFeatures = [
        { label: "Mehrtägige Formate", icon: CalendarDays },
        { label: "Bis zu 200 Personen", icon: UsersRound },
        { label: "Matchmaking-Plattform", icon: Network },
        { label: "Individueller Zeitplan", icon: CalendarClock },
        { label: "Keynotes", icon: MicVocal },
        { label: "Online", icon: Monitor },
        { label: "Hybrid", icon: Blend },
        { label: "Vor Ort", icon: MapPin },
        { label: "Siegerposter", icon: Image },
        { label: "Siegerpokal", icon: Trophy },
        { label: "Internationale Formate", icon: Globe2 },
        { label: "Deutsch oder Englisch", icon: Languages },
        { label: "Zwei Facilitators", icon: UserRoundCheck },
        { label: "Challenge Design", icon: Lightbulb },
        { label: "Eigene Use Cases", icon: Target },
        { label: "Verschiedene Skill Levels", icon: GraduationCap },
        { label: "Demo Session", icon: Presentation },
        { label: "Follow-up", icon: MessageCircle },
        { label: "Pizza-Lunch", icon: Pizza },
        { label: "Cookies", icon: Cookie },
        { label: "Event-Fotos", icon: Camera },
        { label: "Präsentationstechnik", icon: Projector },
        { label: "Eigener oder bereitgestellter Tool Stack", icon: Bot },
        { label: "IT- & Security-Abstimmung", icon: ShieldCheck },
        { label: "Pitch-Vorbereitung", icon: Speech },
        { label: "Pitch- & Voting-System", icon: Vote },
        { label: "Kollaboratives Whiteboard", icon: PenTool },
        { label: "Screen-Recording-Upload", icon: Video },
    ];

    type Profile = { name: string; src: string };
    let activeProfile = $state<Profile | null>(null);
    let profileOrigin: DOMRect | null = null;
    let profileOpener: HTMLButtonElement | null = null;
    let profileZoomImage = $state<HTMLImageElement>(undefined!);
    let profileZoomBackdrop = $state<HTMLButtonElement>(undefined!);
    let profileAnimation: ReturnType<typeof animate> | undefined;
    let backdropAnimation: ReturnType<typeof animate> | undefined;
    let profileClosing = false;

    function reducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function zoomTarget() {
        const size = window.innerWidth <= 640
            ? Math.min(window.innerWidth * 0.68, 260)
            : window.innerHeight * 0.3;
        return {
            size,
            left: (window.innerWidth - size) / 2,
            top: (window.innerHeight - size) / 2,
        };
    }

    async function openProfile(profile: Profile, opener: HTMLButtonElement) {
        if (activeProfile || profileClosing) return;
        const image = opener.querySelector("img");
        if (!image) return;

        const origin = image.getBoundingClientRect();
        profileOrigin = origin;
        profileOpener = opener;
        activeProfile = profile;
        await tick();

        const target = zoomTarget();
        Object.assign(profileZoomImage.style, {
            left: `${target.left}px`,
            top: `${target.top}px`,
            width: `${target.size}px`,
            height: `${target.size}px`,
        });
        profileZoomBackdrop.focus({ preventScroll: true });
        if (reducedMotion()) {
            profileZoomBackdrop.style.opacity = "1";
            return;
        }

        backdropAnimation = animate(profileZoomBackdrop, { opacity: [0, 1] }, { duration: 0.2 });
        profileAnimation = animate(
            profileZoomImage,
            {
                left: [`${origin.left}px`, `${target.left}px`],
                top: [`${origin.top}px`, `${target.top}px`],
                width: [`${origin.width}px`, `${target.size}px`],
                height: [`${origin.height}px`, `${target.size}px`],
            },
            { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        );
    }

    async function closeProfile() {
        if (!activeProfile || profileClosing) return;
        profileClosing = true;
        profileAnimation?.stop();
        backdropAnimation?.stop();

        const originImage = profileOpener?.querySelector("img");
        const destination = originImage?.getBoundingClientRect() ?? profileOrigin;
        if (!reducedMotion() && destination) {
            const current = profileZoomImage.getBoundingClientRect();
            backdropAnimation = animate(profileZoomBackdrop, { opacity: [1, 0] }, { duration: 0.24 });
            profileAnimation = animate(
                profileZoomImage,
                {
                    left: [`${current.left}px`, `${destination.left}px`],
                    top: [`${current.top}px`, `${destination.top}px`],
                    width: [`${current.width}px`, `${destination.width}px`],
                    height: [`${current.height}px`, `${destination.height}px`],
                },
                { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
            );
            await profileAnimation.finished;
        }

        const opener = profileOpener;
        activeProfile = null;
        profileOrigin = null;
        profileOpener = null;
        profileClosing = false;
        await tick();
        opener?.focus({ preventScroll: true });
    }

    const faqs = [
        {
            question: "Was ist ein Agentic Engineering Hackathon?",
            answer: "Ein moderiertes, praktisches Format vor Ort: Teams aus Engineering, Product und Fachbereichen entwickeln an einem Tag einen funktionierenden Prototyp mit aktuellen AI Coding Agents und Developer Tools.",
        },
        {
            question: "Müssen alle Teilnehmenden coden können?",
            answer: "Nein. Die Challenges werden auf unterschiedliche Skill Levels zugeschnitten; so können Engineering, Product und Fachbereiche gemeinsam bauen und lernen.",
        },
        {
            question: "Für welche Teamgrößen ist der Hackathon ausgelegt?",
            answer: "Direkt buchbar sind Formate für bis zu 15, 30 oder 50 Personen. Individuelle Formate sind für bis zu 200 Personen möglich; dabei arbeiten mehrere Build-Teams parallel und präsentieren ihre Ergebnisse gemeinsam.",
        },
        {
            question: "Wie läuft der Tag ab?",
            answer: "Der Standard-Hackathon findet vor Ort an einem Tag statt: Kickoff mit Demo und Challenge-Setup, zwei Build Sprints, gemeinsamer Lunch und eine abschließende Demo Session.",
        },
        {
            question: "Welche Tools kommen zum Einsatz?",
            answer: "Wir arbeiten mit Ihrem vorhandenen Tool Stack oder stellen – nach Absprache – passende Coding Tools für den Tag bereit. Den konkreten Einsatz stimmen wir im Vorbereitungsgespräch ab.",
        },
        {
            question: "Wie berücksichtigt ihr IT, Security und Datenschutz?",
            answer: "Tools, Zugänge, zulässige Datenklassen und die Arbeitsumgebung werden vorab mit Ihren zuständigen Teams geklärt. Gebaut wird ausschließlich in der vereinbarten Umgebung.",
        },
        {
            question: "Was muss bei uns vor Ort vorhanden sein?",
            answer: "Ein geeigneter Raum, stabiles WLAN, Arbeitsgeräte und motivierte Builder. Einen großen Screen nutzen wir gern; falls keiner vorhanden ist, bringen wir Präsentationstechnik mit.",
        },
        {
            question: "Was ist im Preis enthalten?",
            answer: "Enthalten sind zwei Facilitators, Challenge Design, Demo Session, Follow-up, Pizza und Cookies, ein Winner Poster, Event-Fotos sowie die Anreise innerhalb Deutschlands. Die Nettopreise starten bei 4.000 € für bis zu 15 Personen.",
        },
        {
            question: "Wie bereiten wir den Hackathon vor und buchen ihn?",
            answer: "Zu jeder Buchung gehört ein 60-minütiges Vorbereitungsgespräch. Dort schärfen wir Anwendungsfälle, Team, Tool Stack und Rahmenbedingungen; anschließend wird der Termin über den Konfigurator angefragt.",
        },
        {
            question: "Wir haben eine eigene Idee oder besondere Anforderungen – passt das trotzdem?",
            answer: "Unbedingt. Der Hackathon ist unser erprobtes Standardformat, zugleich sind wir offen für Ihre Ideen, konkreten Use Cases und Anforderungen. Schreiben Sie uns oder besprechen Sie Ihr Vorhaben unverbindlich mit uns.",
        },
    ];

    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://all-in-agi.com/#organization",
                name: "ALL IN AGI",
                description:
                    "Agentic Engineering Hackathons für etablierte Unternehmen in Deutschland.",
                url: "https://all-in-agi.com",
                logo: "https://all-in-agi.com/brand/all-in-agi-logo.png",
                email: CONTACT_EMAIL,
                telephone: CONTACT_PHONE_HREF,
            },
            {
                "@type": "WebSite",
                "@id": "https://all-in-agi.com/#website",
                url: "https://all-in-agi.com",
                name: "ALL IN AGI",
                inLanguage: "de-DE",
                publisher: { "@id": "https://all-in-agi.com/#organization" },
            },
            {
                "@type": "Service",
                "@id": "https://all-in-agi.com/#agentic-engineering-hackathon",
                name: "Agentic Engineering Hackathon",
                serviceType: "Moderierter Agentic Engineering Hackathon für Unternehmen",
                description:
                    "Teams entwickeln an einem Tag gemeinsam einen funktionierenden Prototyp mit aktuellen KI-Entwicklerwerkzeugen.",
                areaServed: { "@type": "Country", name: "Deutschland" },
                provider: { "@id": "https://all-in-agi.com/#organization" },
                url: "https://all-in-agi.com/",
            },
        ],
    };

    onMount(() => {
        const heroCopy = document.querySelector<HTMLElement>(".hero-copy");
        const root = document.documentElement;
        let frame: number | undefined;

        function updateMobileNavCta() {
            frame = undefined;
            root.classList.toggle(
                "mobile-nav-cta-visible",
                Boolean(heroCopy && heroCopy.getBoundingClientRect().bottom <= 44),
            );
        }

        function scheduleMobileNavCtaUpdate() {
            if (frame !== undefined) return;
            frame = requestAnimationFrame(updateMobileNavCta);
        }

        window.addEventListener("scroll", scheduleMobileNavCtaUpdate, { passive: true });
        window.addEventListener("resize", scheduleMobileNavCtaUpdate, { passive: true });
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && activeProfile) void closeProfile();
        };
        window.addEventListener("keydown", handleKeydown);
        updateMobileNavCta();

        return () => {
            if (frame !== undefined) cancelAnimationFrame(frame);
            window.removeEventListener("scroll", scheduleMobileNavCtaUpdate);
            window.removeEventListener("resize", scheduleMobileNavCtaUpdate);
            window.removeEventListener("keydown", handleKeydown);
            profileAnimation?.stop();
            backdropAnimation?.stop();
            root.classList.remove("mobile-nav-cta-visible");
        };
    });
</script>

<SeoHead
    title="Agentic Engineering Hackathon für Unternehmen | ALL IN AGI"
    description="Ihr Team baut in einem Tag einen funktionierenden Prototyp mit aktuellen Coding Agents – als moderierter Hackathon vor Ort in Deutschland."
    path="/"
/>

<JsonLd data={schema} />

<section class="hero">
    <div class="hero-copy" use:reveal>
        <h1 class="display-title">Your Team Can Just Build Things</h1>
        <p class="lede">
            Lassen Sie Ihr Team die neuen Möglichkeiten von Coding Agents Hands-on mit einem
            Hackathon bei Ihnen vor Ort erleben.
        </p>
        <div class="hero-actions">
            <a class="button-primary" href="/buchen" data-analytics-event="booking_cta" data-analytics-placement="hero">Hackathon planen</a>
            <a class="button-secondary" href="#format">Agenda ansehen</a>
        </div>
    </div>
    <div class="hero-image">
        <img
            src="/images/all-in-agi-event.webp"
            alt="Team arbeitet gemeinsam an einem Hackathon-Projekt"
            fetchpriority="high"
        />
    </div>
</section>

<section class="manifesto" aria-labelledby="manifesto-title">
    <div class="manifesto-content" use:reveal>
        <h2 id="manifesto-title"><s>Fortbildung</s> Hackathon</h2>
        <p>
            Statt theoretischer Schulung entwickelt Ihr Team an einem Tag gemeinsam einen
            funktionierenden Prototyp mit aktuellen KI-Entwicklerwerkzeugen.
        </p>
    </div>
    <div class="tool-carousel" role="img" aria-label={carouselLabel}>
        <div class="tool-carousel-window">
            <div class="tool-carousel-track" aria-hidden="true">
                {#each [0, 1] as copy}
                    <div class:duplicate={copy === 1} class="tool-carousel-group">
                        {#each carouselRepeats as repetition}
                            <div class:duplicate-set={repetition > 0} class="tool-carousel-set">
                                {#each carouselTools as tool}
                                    <div class="tool-carousel-item">
                                        <img src={tool.icon} alt="" width="96" height="96" />
                                        <span>{tool.label}</span>
                                    </div>
                                {/each}
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</section>

<section class="adoption-gap" aria-label="Die Lücke zwischen KI-Ambition und praktischer Anwendung">
    <img
        class="adoption-gap-image"
        src="/images/ai-adoption-hackathon.webp"
        alt=""
        loading="lazy"
        decoding="async"
    />
    <div class="adoption-gap-inner">
        <div class="adoption-gap-copy" use:reveal>
            <p class="adoption-gap-conclusion">
                Der beste Weg, die Adaptionslücke zu schließen: ein Hackathon, bei dem das Team
                gemeinsam baut und ausprobiert.
            </p>
            <div class="adoption-gap-source">
                <a class="button-secondary"
                    href="https://www.celonis.com/de/news/press/the-enterprise-ai-reality-check-high-ambitions-meet-operational-barriers"
                    target="_blank"
                    rel="noreferrer">Mehr erfahren</a
                >
            </div>
        </div>

        <dl class="adoption-gap-stats" use:reveal={{ group: true }}>
            <div class="adoption-gap-stat">
                <dt><strong>85</strong><span>%</span></dt>
                <dd>wollen in den nächsten zwei bis drei Jahren zum Agentic Enterprise werden.</dd>
            </div>
            <div class="adoption-gap-stat">
                <dt><strong>17</strong><span>%</span></dt>
                <dd>der Unternehmen im DACH-Raum nutzen bereits AI Agents.</dd>
            </div>
        </dl>
    </div>
</section>

<section class="custom-formats" aria-labelledby="custom-formats-title">
    <div class="section-wrap">
        <div use:reveal>
            <h2 id="custom-formats-title" class="section-title">Wie Sie es brauchen</h2>
        </div>
        <div class="feature-cloud" use:reveal={{ group: true }}>
            {#each formatFeatures as feature}
                <div class="feature-float">
                    <div class="feature-pill">
                        <feature.icon size={25} strokeWidth={1.8} aria-hidden="true" />
                        <span>{feature.label}</span>
                    </div>
                </div>
            {/each}
        </div>
        <div class="custom-formats-action" use:reveal>
            <a
                class="button-secondary"
                href={customFormatUrl}
                target="_blank"
                rel="noreferrer"
                data-analytics-event="booking_cta"
                data-analytics-placement="custom-formats">Kontakt aufnehmen</a
            >
        </div>
    </div>
</section>

<section id="format" class="agenda">
    <div class="section-wrap">
        <div class="agenda-grid agenda-grid-four" use:reveal={{ group: true }}>
            <article class="agenda-card">
                <span class="time">09:00</span>
                <h3>Kickoff</h3>
                <p>Live Demo, Tool Stack, Teams und Challenges.</p>
            </article>
            <article class="agenda-card">
                <span class="time">09:30</span>
                <h3>Build Sprint</h3>
                <p>Von Problem und User Flow zum ersten Working Prototype.</p>
            </article>
            <article class="agenda-card">
                <span class="time">13:00</span>
                <h3>Pizza</h3>
                <p>Gemeinsamer Lunch, Feedback und zweiter Build Sprint.</p>
            </article>
            <article class="agenda-card">
                <span class="time">16:30</span>
                <h3>Demo Session</h3>
                <p>Problem, Lösung, How its used and build</p>
            </article>
        </div>
    </div>
</section>

<section id="preis" class="pricing">
    <div class="section-wrap">
        <div class="pricing-grid" use:reveal={{ group: true }}>
            <article class="price-card">
                <h3>Bis 15 Personen</h3>
                <strong>4.000 €</strong><span>netto</span>
                <ul>
                    <li><Users size={17} />2 Facilitator</li>
                    <li><Lightbulb size={17} />Challenge Design</li>
                    <li><Presentation size={17} />Demo Session & Follow-up</li>
                    <li><Pizza size={17} />Pizza & Cookies</li>
                    <li><MapPin size={17} />Vor Ort in Ihren Räumen</li>
                </ul>
            </article>
            <article class="price-card featured">
                <span class="tag">Most popular</span>
                <h3>Bis 30 Personen</h3>
                <strong>5.000 €</strong><span>netto</span>
                <ul>
                    <li><Users size={17} />2 Facilitators</li>
                    <li><Lightbulb size={17} />Challenge Design</li>
                    <li><Presentation size={17} />Demo Session & Follow-up</li>
                    <li><Pizza size={17} />Pizza & Cookies</li>
                    <li><MapPin size={17} />Vor Ort in Ihren Räumen</li>
                </ul>
            </article>
            <article class="price-card">
                <h3>Bis 50 Personen</h3>
                <strong>6.000 €</strong><span>netto</span>
                <ul>
                    <li><Users size={17} />2 Facilitators</li>
                    <li><Lightbulb size={17} />Challenge Design</li>
                    <li><Presentation size={17} />Demo Session & Follow-up</li>
                    <li><Pizza size={17} />Pizza & Cookies</li>
                    <li><MapPin size={17} />Vor Ort in Ihren Räumen</li>
                </ul>
            </article>
        </div>
        <div class="section-action">
            <a class="button-primary" href="/buchen" data-analytics-event="booking_cta" data-analytics-placement="pricing">Hackathon planen</a><a
                class="button-secondary"
                href="#kontakt">Kontakt aufnehmen</a
            >
        </div>
    </div>
</section>

<section id="kontakt" class="contact-section">
    <div class="section-wrap">
        <div use:reveal><h2 class="section-title">Kontakt</h2></div>
        <div class="team-profiles" use:reveal={{ group: true }} aria-label="Ihre Ansprechpartner">
            <article class="team-profile">
                <button
                    type="button"
                    class="team-profile-image-button"
                    aria-label="Profilbild von Maddox Sciuchetti vergrößern"
                    aria-expanded={activeProfile?.name === "Maddox Sciuchetti"}
                    onclick={(event) => openProfile(
                        { name: "Maddox Sciuchetti", src: "/images/team/maddox-sciuchetti.jpg" },
                        event.currentTarget,
                    )}
                >
                    <img
                        src="/images/team/maddox-sciuchetti.jpg"
                        alt="Maddox Sciuchetti"
                        width="40"
                        height="40"
                        loading="lazy"
                        decoding="async"
                    />
                </button>
                <div class="team-profile-details">
                    <h3>Maddox Sciuchetti</h3>
                    <div class="team-profile-links">
                        <a href="mailto:maddox@all-in-agi.com" aria-label="E-Mail an Maddox Sciuchetti" title="E-Mail">
                            <Mail size={15} strokeWidth={2} aria-hidden="true" />
                        </a>
                        <a
                            class="brand-link"
                            href="https://github.com/MaddoxSciuchetti"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="GitHub-Profil von Maddox Sciuchetti"
                            title="GitHub"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true"
                                ><path
                                    d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A11 11 0 0 1 12 6.12c.98 0 1.95.13 2.87.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.78 1.06.78 2.14v3.26c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"
                                /></svg
                            >
                        </a>
                        <a
                            class="brand-link"
                            href="https://www.linkedin.com/in/maddoxsciuchetti/"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="LinkedIn-Profil von Maddox Sciuchetti"
                            title="LinkedIn"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true"
                                ><path
                                    d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.04H3.54V8.98H7.1v11.47ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z"
                                /></svg
                            >
                        </a>
                    </div>
                </div>
            </article>
            <article class="team-profile">
                <button
                    type="button"
                    class="team-profile-image-button"
                    aria-label="Profilbild von Emilian Scheel vergrößern"
                    aria-expanded={activeProfile?.name === "Emilian Scheel"}
                    onclick={(event) => openProfile(
                        { name: "Emilian Scheel", src: "/images/team/emilian-scheel.jpg" },
                        event.currentTarget,
                    )}
                >
                    <img
                        src="/images/team/emilian-scheel.jpg"
                        alt="Emilian Scheel"
                        width="40"
                        height="40"
                        loading="lazy"
                        decoding="async"
                    />
                </button>
                <div class="team-profile-details">
                    <h3>Emilian Scheel</h3>
                    <div class="team-profile-links">
                        <a href="mailto:emilian@all-in.com" aria-label="E-Mail an Emilian Scheel" title="E-Mail">
                            <Mail size={15} strokeWidth={2} aria-hidden="true" />
                        </a>
                        <a
                            class="brand-link"
                            href="https://github.com/emilianscheel"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="GitHub-Profil von Emilian Scheel"
                            title="GitHub"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true"
                                ><path
                                    d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A11 11 0 0 1 12 6.12c.98 0 1.95.13 2.87.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.78 1.06.78 2.14v3.26c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"
                                /></svg
                            >
                        </a>
                        <a
                            class="brand-link"
                            href="https://www.linkedin.com/in/emilianscheel"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="LinkedIn-Profil von Emilian Scheel"
                            title="LinkedIn"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true"
                                ><path
                                    d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.04H3.54V8.98H7.1v11.47ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z"
                                /></svg
                            >
                        </a>
                    </div>
                </div>
            </article>
        </div>
        <div class="contact-grid" use:reveal={{ group: true }}>
            <article class="contact-card">
                <Mail size={46} strokeWidth={1.7} aria-hidden="true" />
                <h3>E-Mail</h3>
                <p>Jederzeit.</p>
                <a href={`mailto:${CONTACT_EMAIL}`}
                    >{CONTACT_EMAIL} <span aria-hidden="true">›</span></a
                >
            </article>
            <article class="contact-card">
                <Phone size={46} strokeWidth={1.7} aria-hidden="true" />
                <h3>Telefon</h3>
                <p>Jederzeit oder schneller Rückruf.</p>
                <a href={`tel:${CONTACT_PHONE_HREF}`}
                    >{CONTACT_PHONE_DISPLAY} <span aria-hidden="true">›</span></a
                >
            </article>
            <article class="contact-card">
                <CalendarClock size={46} strokeWidth={1.7} aria-hidden="true" />
                <h3>Intro Call</h3>
                <p>60 Minuten für für alle Fragen. Unverbindlich.</p>
                <a href="/buchen" data-analytics-event="booking_cta" data-analytics-placement="contact">Termin auswählen <span aria-hidden="true">›</span></a>
            </article>
        </div>
    </div>
</section>

{#if activeProfile}
    <button
        bind:this={profileZoomBackdrop}
        type="button"
        class="profile-zoom-backdrop"
        aria-label={`Vergrößertes Profilbild von ${activeProfile.name} schließen`}
        onclick={closeProfile}
    >
        <img
            bind:this={profileZoomImage}
            class="profile-zoom-image"
            src={activeProfile.src}
            alt={activeProfile.name}
        />
    </button>
{/if}

<section>
    <div class="section-wrap faq-wrap">
        <div use:reveal><h2 class="section-title">Häufige Fragen</h2></div>
        <Accordion.Root class="faq-list" type="multiple">
            {#each faqs as faq, index}
                <Accordion.Item class="faq-item" value={`faq-${index}`}>
                    <Accordion.Header class="faq-header">
                        <Accordion.Trigger class="faq-trigger"
                            >{faq.question}<span class="faq-symbol" aria-hidden="true"
                            ></span></Accordion.Trigger
                        >
                    </Accordion.Header>
                    <Accordion.Content class="faq-answer"
                        ><div><p>{faq.answer}</p></div></Accordion.Content
                    >
                </Accordion.Item>
            {/each}
        </Accordion.Root>
    </div>
</section>

<ClosingCta />
