<script lang="ts">
    import { onMount } from "svelte";
    import { afterNavigate, goto, invalidateAll } from "$app/navigation";
    import { page } from "$app/state";
    import { installGlobalHaptics } from "$lib/haptics";
    import { robotsDirective } from "$lib/seo";
    import GtmFooter from "$lib/GtmFooter.svelte";
    import { gtmPaths } from "$lib/gtm-pages";
    import CookieConsent from "$lib/CookieConsent.svelte";
    import CommandPalette from "$lib/CommandPalette.svelte";
    import { activateAnalyticsForPath, installBookingCtaTracking } from "$lib/analytics";
    import { localizedPath, switchLocalePath, ui, type Locale } from "$lib/i18n";
    import { ExternalLink } from "lucide-svelte";
    import "@fontsource/instrument-serif";
    import "../app.css";
    import "$lib/styles/shadcn.css";
    import { ArrowUpRight } from "lucide-svelte";
    let { children, data } = $props();
    let locale = $derived(data.locale as Locale);
    let copy = $derived(ui[locale]);
    let presentationRoute = $derived(
        page.route.id === "/timer" ||
            page.route.id === "/clock" ||
            page.route.id === "/slides" ||
            page.route.id === "/[id]/timer",
    );
    let adminRouteIds = ["/dashboard", "/buchungen", "/user", "/offer", "/offer/[token]"];
    let adminNavigation = $derived(
        adminRouteIds.includes(page.route.id ?? "") ||
            (page.route.id === "/[id]" && data.admin.authorized),
    );
    let offerRoute = $derived(page.route.id === "/offer" || page.route.id === "/offer/[token]");
    let gtmArticleRoute = $derived(gtmPaths.some((path) => path === page.route.id));
    let currentGtmSlug = $derived(gtmArticleRoute ? page.route.id?.slice(1) : undefined);
    let bookingsLabel = $derived(locale === "en" ? "Bookings" : "Buchungen");
    let usersLabel = $derived(locale === "en" ? "Users" : "Nutzer");
    let dashboardHref = $derived(localizedPath(locale, "/dashboard"));
    let bookingsHref = $derived(localizedPath(locale, "/buchungen"));
    let userHref = $derived(localizedPath(locale, "/user"));
    let offerHref = $derived(localizedPath(locale, "/offer"));
    let offerLabel = $derived(locale === "en" ? "Offers" : "Angebote");

    onMount(() => {
        const removeHaptics = installGlobalHaptics();
        const removeCtaTracking = installBookingCtaTracking();
        void activateAnalyticsForPath(page.url.pathname);
        afterNavigate(
            ({ to }) => void activateAnalyticsForPath(to?.url.pathname ?? location.pathname),
        );
        return () => {
            removeHaptics?.();
            removeCtaTracking();
        };
    });

    async function logout() {
        const { authClient } = await import("$lib/auth-client");
        await authClient.signOut();
        await invalidateAll();
        await goto(localizedPath(locale, "/dashboard"));
    }
</script>

<svelte:head>
    <link rel="icon" href="/brand/all-in-agi-logo.png" type="image/png" sizes="512x512" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
    <meta name="robots" content={robotsDirective(page.url.pathname)} />
</svelte:head>

{#if !presentationRoute}
    <a class="skip-link" href="#main">{copy.skip}</a>
    <header class:admin-header={adminNavigation} class="site-header">
        {#if adminNavigation}
            <nav class="nav-inner admin-nav-inner" aria-label="Admin-Navigation">
                <a
                    class="brand-mark admin-brand-mark"
                    href={dashboardHref}
                    aria-label="ALL IN AGI Dashboard"
                >
                    <span class="brand-icon" aria-hidden="true"
                        ><img
                            src="/brand/all-in-agi-logo.png"
                            alt=""
                            width="512"
                            height="512"
                        /></span
                    >
                    <span class="brand-wordmark" aria-hidden="true">
                        {#each [..."ALL IN AGI"] as character, index}
                            <span class="brand-character" style={`--char-index: ${index}`}
                                >{character === " " ? "\u00a0" : character}</span
                            >
                        {/each}
                    </span>
                </a>
                <div class="admin-nav-links">
                    <a class:active={page.route.id === "/dashboard"} href={dashboardHref}
                        >Dashboard</a
                    >
                    <a class:active={page.route.id === "/user"} href={userHref}>{usersLabel}</a>
                    <a class:active={page.route.id === "/buchungen"} href={bookingsHref}
                        >{bookingsLabel}</a
                    >
                    <a class:active={offerRoute} href={offerHref}>{offerLabel}</a>
                    <a
                        class="admin-nav-external"
                        href="/timer"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Timer <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden="true" />
                    </a>
                    <a
                        class="admin-nav-external"
                        href="/clock"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Clock <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden="true" />
                    </a>
                    <a
                        class="admin-nav-external"
                        href="/slides"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Slides <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden="true" />
                    </a>
                </div>
                <div class="admin-nav-action">
                    {#if data.admin.authenticated}<button
                            class="nav-cta admin-logout"
                            type="button"
                            onclick={logout}>Logout</button
                        >{/if}
                </div>
            </nav>
        {:else}
            <nav class="nav-inner" aria-label={copy.navLabel}>
                <a class="brand-mark" href={localizedPath(locale, "/")} aria-label={copy.homeLabel}>
                    <span class="brand-icon" aria-hidden="true">
                        <img src="/brand/all-in-agi-logo.png" alt="" width="512" height="512" />
                    </span>
                    <span class="brand-wordmark" aria-hidden="true">
                        {#each [..."ALL IN AGI"] as character, index}
                            <span class="brand-character" style={`--char-index: ${index}`}
                                >{character === " " ? "\u00a0" : character}</span
                            >
                        {/each}
                    </span>
                </a>
                <div class="nav-links">
                    <a href={`${localizedPath(locale, "/")}#format`}>{copy.agenda}</a>
                    <a href={`${localizedPath(locale, "/")}#pricing`}>{copy.price}</a>
                    <a href={`${localizedPath(locale, "/")}#contact`}>{copy.contact}</a>
                </div>
                <a
                    class="nav-cta"
                    href={localizedPath(locale, "/buchen")}
                    data-analytics-event="booking_cta"
                    data-analytics-placement="header">{copy.plan}</a
                >
            </nav>
        {/if}
    </header>
{/if}

<main id="main" class:presentation-main={presentationRoute}>
    {@render children()}
</main>

{#if !presentationRoute && !offerRoute}
    {#if page.route.id === "/" || gtmArticleRoute}<GtmFooter
            currentSlug={currentGtmSlug}
            {locale}
        />{/if}
    <footer class="site-footer">
        <div class="footer-inner">
            <div class="footer-links">
                <a href={localizedPath(locale, "/impressum")}>{copy.legalNotice}</a>
                <a href={localizedPath(locale, "/agb")}>{copy.terms}</a>
                <a href={localizedPath(locale, "/datenschutz")}>{copy.privacy}</a>
                <a href={localizedPath(locale, "/verwalten")}>{copy.manage}</a>
                <a
                    href={switchLocalePath(page.url, locale === "de" ? "en" : "de")}
                    hreflang={locale === "de" ? "en" : "de"}
                    >{locale === "de" ? "English" : "German"}</a
                >
            </div>
        </div>
    </footer>
{/if}

{#if !presentationRoute && !adminNavigation}<CookieConsent {locale} />{/if}

<CommandPalette {locale} />
