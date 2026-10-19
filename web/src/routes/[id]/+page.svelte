<script lang="ts">
    import {
        Award,
        Ban,
        Building2,
        CalendarDays,
        CalendarPlus,
        Camera,
        Check,
        Clock3,
        Code2,
        Contact,
        Cookie,
        Download,
        MapPin,
        MapPinned,
        Laptop,
        Mail,
        MessageSquareText,
        Monitor,
        Pizza,
        Plane,
        ReceiptEuro,
        RotateCcw,
        Undo2,
        UserRoundX,
        Users,
    } from "lucide-svelte";
    import InvoiceActionsMenu from "$lib/components/admin/invoice-actions-menu.svelte";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { AlertDialog } from "bits-ui";
    import { invalidateAll } from "$app/navigation";
    import AddressEditor from "$lib/config/AddressEditor.svelte";
    import ConfigOptionCards, { type OptionValues } from "$lib/config/ConfigOptionCards.svelte";
    import ContactFields from "$lib/config/ContactFields.svelte";
    import MessageField from "$lib/config/MessageField.svelte";
    import PrepCallEditor from "$lib/config/PrepCallEditor.svelte";
    import EditableSummaryRow from "$lib/EditableSummaryRow.svelte";
    import EventDateTimeEditor from "$lib/EventDateTimeEditor.svelte";
    import { formatEventTimeRange } from "$lib/event-time";
    import MapPreview from "$lib/MapPreview.svelte";
    import MiniContactCards from "$lib/MiniContactCards.svelte";
    import SharePlanButton from "$lib/SharePlanButton.svelte";
    import { eventDateBounds } from "$lib/event-date";
    import {
        configurationDateChecks,
        effectiveBillingDetails,
        formatPrice,
        selectedCodingToolLabels,
        validateBillingDetails,
        validateConfiguration,
        type BillingDetails,
        type BookingConfiguration,
    } from "$lib/booking";
    import { bookingOverviewRows, type BookingOverviewRowId } from "$lib/booking-overview";
    import type { HackathonUpdate } from "$lib/hackathon-edit";
    import { isStandardOfferLegalVersion } from "$lib/legal";
    import { untrack } from "svelte";
    import type { PageData } from "./$types";
    import type { Locale } from "$lib/i18n";

    let { data }: { data: PageData } = $props();
    type EditSection = HackathonUpdate["section"];

    const initialHackathon = untrack(() => data.hackathon);
    const initialInvoice = untrack(() => data.invoice);
    let hackathon = $state(initialHackathon);
    let locale = $derived((data.locale ?? "de") as Locale);
    let activeSection = $state<EditSection | null>(null);
    let saving = $state(false);
    let eventSlotsLoading = $state(false);
    let eventAvailabilityKey = $state(0);
    let editError = $state("");
    let confirmationEmailState = $state<"idle" | "loading" | "sent" | "error">("idle");
    let invoiceDownloadState = $state<"idle" | "loading" | "error">("idle");
    let invoiceDraftState = $state<"idle" | "loading" | "error">("idle");
    let depositDraftState = $state<"idle" | "loading" | "error">("idle");
    let invoiceEmailState = $state<"idle" | "loading" | "sent" | "error">("idle");
    let invoiceTestState = $state<"idle" | "loading" | "sent" | "error">("idle");
    let invoiceIssued = $state(Boolean(initialInvoice?.issued));
    let invoiceEmailSentAt = $state<string | null>(initialInvoice?.emailSentAt ?? null);
    let downPaymentDownloadState = $state<"idle" | "loading" | "error">("idle");
    let downPaymentEmailState = $state<"idle" | "loading" | "sent" | "error">("idle");
    let downPaymentTestState = $state<"idle" | "loading" | "sent" | "error">("idle");
    let downPaymentIssued = $state(Boolean(initialInvoice?.downPayment.issued));
    let downPaymentEmailSentAt = $state<string | null>(
        initialInvoice?.downPayment.emailSentAt ?? null,
    );
    let downPaymentPaidAt = $state<string | null>(initialInvoice?.downPayment.paidAt ?? null);
    let downPaymentPaidBusy = $state(false);
    let invoiceMessage = $state("");
    let cancellationBusy = $state(false);
    let cancellationMessage = $state("");
    let contractBusy = $state(false);
    let contractMessage = $state("");
    let agreementCustomerName = $state(initialHackathon.contactName);
    let agreementOrganizerName = $state("Emilian Scheel");
    let agreementModalOpen = $state(false);
    let agreementModalMode = $state<"record" | "test">("record");
    let contractTestEmailState = $state<"idle" | "loading" | "sent" | "error">("idle");
    let cancelDialogOpen = $state(false);
    let prepCallMode = $state<"quick" | "custom">("quick");
    let customPrepCallDate = $state("");
    let draft = $state<BookingConfiguration>(configurationFromHackathon(initialHackathon));
    const { min: minEventDate, max: maxEventDate } = eventDateBounds();

    let eventAddressLabel = $derived(
        [
            hackathon.address.street,
            [hackathon.address.postalCode, hackathon.address.city].filter(Boolean).join(" "),
        ]
            .filter(Boolean)
            .join(", "),
    );
    let equipmentLabel = $derived(
        hackathon.equipment === "none"
            ? locale === "en"
                ? "Provided by us"
                : "Wird von uns gestellt"
            : locale === "en"
              ? "Projector / Display"
              : "Beamer / Display",
    );
    let codingToolLabels = $derived(selectedCodingToolLabels(hackathon));
    let draftOptions = $derived<OptionValues>({
        capacity: draft.capacity,
        venueProvided: draft.venueProvided,
        equipment: draft.equipment,
        lunch: draft.lunch,
        customLunch: draft.customLunch,
        toolProvision: draft.toolProvision,
        codingTools: draft.codingTools,
        customCodingTool: draft.customCodingTool,
        deviceProvision: draft.deviceProvision,
        deviceCount: draft.deviceCount,
    });
    let overviewRows = $derived(
        bookingOverviewRows({ ...hackathon, locale }, hackathon.prepCallBooking),
    );
    let readOnly = $derived(!["prep_scheduled", "confirmed"].includes(hackathon.status));
    let canScheduleDeferredEvent = $derived(
        !hackathon.eventStart &&
            ["prep_scheduled", "exit_window", "contracted", "confirmed"].includes(hackathon.status),
    );
    let invoiceEligible = $derived(
        ["contracted", "confirmed", "completed"].includes(hackathon.status),
    );
    let invoiceDraftAvailable = $derived(
        ["prep_scheduled", "exit_window", "contracted", "confirmed", "completed"].includes(
            hackathon.status,
        ),
    );
    let cancellableContract = $derived(["contracted", "confirmed"].includes(hackathon.status));
    let billingModel = $state(initialInvoice?.billingModel ?? null);
    let invoiceKind = $state(initialInvoice?.kind ?? null);
    let splitBilling = $derived(billingModel === "deposit_30");
    let showDepositInvoice = $derived(splitBilling && (invoiceEligible || downPaymentIssued));
    let invoiceIsFinal = $derived(splitBilling && (invoiceKind === "final" || !invoiceIssued));
    let finalInvoiceAvailable = $derived(
        Boolean(hackathon.eventEnd) &&
            (!splitBilling ||
                (Boolean(downPaymentPaidAt) && new Date() >= new Date(hackathon.eventEnd!))),
    );
    let standardOffer = $derived(isStandardOfferLegalVersion(hackathon.legalVersion));
    let billingForContract = $derived(
        effectiveBillingDetails({
            billing: hackathon.billing,
            companyName: hackathon.companyName,
            contactName: hackathon.contactName,
            email: hackathon.email,
            address: hackathon.address,
        }),
    );
    let billingComplete = $derived(validateBillingDetails(billingForContract, locale).length === 0);

    function billingDraft(value: typeof data.hackathon): BillingDetails {
        return (
            value.billing ?? {
                companyName: value.companyName,
                legalForm: "",
                contactName: value.contactName,
                email: value.email,
                vatId: "",
                purchaseOrder: "",
                address: {
                    street: value.address.street,
                    postalCode: value.address.postalCode,
                    city: value.address.city,
                    country: "Deutschland",
                },
            }
        );
    }

    function configurationFromHackathon(value: typeof data.hackathon): BookingConfiguration {
        return {
            locale: value.locale,
            capacity: value.capacity,
            venueProvided: value.venueProvided,
            equipment: value.equipment,
            lunch: value.lunch,
            customLunch: value.customLunch,
            toolProvision: value.toolProvision,
            codingTools: [...value.codingTools],
            customCodingTool: value.customCodingTool,
            deviceProvision: value.deviceProvision,
            deviceCount: value.deviceCount,
            eventPhotos: value.eventPhotos,
            companyName: value.companyName,
            contactName: value.contactName,
            email: value.email,
            phone: value.phone,
            message: value.message,
            address: { ...value.address },
            eventStart: value.eventStart,
            eventEnd: value.eventEnd,
            consultationSlot: value.consultationSlot,
            billing: billingDraft(value),
            businessCustomerConfirmed: value.businessCustomerConfirmed,
            authorityConfirmed: value.authorityConfirmed,
        };
    }

    function openAgreementModal(mode: "record" | "test") {
        agreementModalMode = mode;
        agreementModalOpen = true;
        contractMessage = "";
    }

    async function submitAgreementModal() {
        if (agreementModalMode === "test") {
            await sendContractTestEmail();
            return;
        }
        await recordAgreement();
    }

    async function recordAgreement() {
        if (contractBusy) return;
        contractBusy = true;
        contractMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/contract-agreement`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    customerName: agreementCustomerName,
                    organizerName: agreementOrganizerName,
                }),
            });
            const result = await response.json();
            if (!response.ok && response.status !== 202)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The agreement could not be saved."
                            : "Die Zustimmung konnte nicht gespeichert werden."),
                );
            hackathon = { ...hackathon, status: result.status, exitDeadline: result.exitDeadline };
            contractMessage = result.emailSent
                ? locale === "en"
                    ? "Agreement saved and contract confirmation sent."
                    : "Zustimmung gespeichert und Vertragsbestätigung versandt."
                : result.message;
            agreementModalOpen = false;
            await invalidateAll();
        } catch (error) {
            contractMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The agreement could not be saved."
                      : "Die Zustimmung konnte nicht gespeichert werden.";
        } finally {
            contractBusy = false;
        }
    }

    async function sendContractTestEmail() {
        if (contractBusy || contractTestEmailState === "loading") return;
        contractBusy = true;
        contractTestEmailState = "loading";
        contractMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/contract-email-test`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    customerName: agreementCustomerName,
                    organizerName: agreementOrganizerName,
                }),
            });
            const result = await response.json();
            if (!response.ok)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The test contract email could not be sent."
                            : "Die Test-Vertrags-E-Mail konnte nicht gesendet werden."),
                );
            contractTestEmailState = "sent";
            contractMessage =
                locale === "en"
                    ? "Test contract email sent to go@all-in-agi.com."
                    : "Test-Vertrags-E-Mail an go@all-in-agi.com gesendet.";
            agreementModalOpen = false;
        } catch (error) {
            contractTestEmailState = "error";
            contractMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The test contract email could not be sent."
                      : "Die Test-Vertrags-E-Mail konnte nicht gesendet werden.";
        } finally {
            contractBusy = false;
        }
    }

    async function withdrawDuringExitWindow(by: "customer" | "organizer") {
        if (contractBusy) return;
        contractBusy = true;
        contractMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/contract-withdraw`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ by }),
            });
            const result = await response.json();
            if (!response.ok)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The withdrawal could not be saved."
                            : "Der Rücktritt konnte nicht gespeichert werden."),
                );
            hackathon = { ...hackathon, status: result.status };
            contractMessage =
                locale === "en"
                    ? "The free withdrawal was saved in the audit log."
                    : "Der kostenfreie Rücktritt wurde revisionsfest gespeichert.";
            await invalidateAll();
        } catch (error) {
            contractMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The withdrawal could not be saved."
                      : "Der Rücktritt konnte nicht gespeichert werden.";
        } finally {
            contractBusy = false;
        }
    }

    async function completeContract() {
        if (contractBusy) return;
        contractBusy = true;
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/contract-complete`, {
                method: "POST",
            });
            const result = await response.json();
            if (!response.ok)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The contract could not be completed."
                            : "Der Vertrag konnte nicht abgeschlossen werden."),
                );
            hackathon = { ...hackathon, status: result.status };
            contractMessage =
                locale === "en"
                    ? "Marked as completed."
                    : "Durchführung als abgeschlossen markiert.";
            await invalidateAll();
        } catch (error) {
            contractMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The contract could not be completed."
                      : "Der Vertrag konnte nicht abgeschlossen werden.";
        } finally {
            contractBusy = false;
        }
    }

    function overviewRow(id: BookingOverviewRowId) {
        return overviewRows.find((row) => row.id === id)!;
    }

    function updateDraftOptions(patch: Partial<OptionValues>) {
        const next = { ...draft, ...patch };
        if (
            patch.capacity !== undefined &&
            next.deviceProvision === "needed" &&
            next.deviceCount > patch.capacity
        ) {
            next.deviceCount = patch.capacity;
        }
        draft = next;
    }

    function updateDraftBilling(patch: Partial<BillingDetails>) {
        draft = { ...draft, billing: { ...draft.billing!, ...patch } };
    }

    function updateDraftBillingAddress(patch: Partial<BillingDetails["address"]>) {
        draft = {
            ...draft,
            billing: { ...draft.billing!, address: { ...draft.billing!.address, ...patch } },
        };
    }

    function openEditor(section: EditSection) {
        if (readOnly && !(section === "event-time" && canScheduleDeferredEvent)) return;
        if (activeSection === section) {
            cancelEditor();
            return;
        }
        draft = configurationFromHackathon(hackathon);
        prepCallMode = "quick";
        customPrepCallDate = "";
        editError = "";
        activeSection = section;
    }

    function cancelEditor() {
        draft = configurationFromHackathon(hackathon);
        editError = "";
        activeSection = null;
    }

    function updatePayload(section: EditSection): HackathonUpdate {
        switch (section) {
            case "capacity":
                return { section, capacity: draft.capacity };
            case "venue":
                return { section, venueProvided: draft.venueProvided };
            case "tools":
                return {
                    section,
                    toolProvision: draft.toolProvision!,
                    codingTools: draft.codingTools,
                    customCodingTool: draft.customCodingTool,
                };
            case "devices":
                return {
                    section,
                    deviceProvision: draft.deviceProvision!,
                    deviceCount: draft.deviceCount,
                };
            case "equipment":
                return { section, equipment: draft.equipment };
            case "lunch":
                return { section, lunch: draft.lunch, customLunch: draft.customLunch };
            case "address":
                return { section, address: draft.address };
            case "event-time": {
                if (!draft.eventStart || !draft.eventEnd)
                    throw new Error(
                        locale === "en"
                            ? "Please select a hackathon date."
                            : "Bitte wählen Sie einen Hackathon-Termin.",
                    );
                return { section, eventStart: draft.eventStart, eventEnd: draft.eventEnd };
            }
            case "prep-call":
                return { section, consultationSlot: draft.consultationSlot };
            case "company":
                return { section, companyName: draft.companyName };
            case "contact":
                return {
                    section,
                    contactName: draft.contactName,
                    email: draft.email,
                    phone: draft.phone,
                };
            case "billing":
                return { section, billing: draft.billing! };
            case "message":
                return { section, message: draft.message };
        }
    }

    async function saveEditor() {
        if (!activeSection) return;
        const errors = validateConfiguration(
            { ...draft, locale },
            configurationDateChecks(activeSection),
        );
        if (activeSection === "billing")
            errors.push(...validateBillingDetails(draft.billing, locale));
        if (errors.length) {
            editError = errors[0];
            return;
        }
        saving = true;
        editError = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(updatePayload(activeSection)),
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 409 && result.field === "hackathon")
                    eventAvailabilityKey += 1;
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The changes could not be saved."
                            : "Die Änderungen konnten nicht gespeichert werden."),
                );
            }
            hackathon = result.hackathon;
            draft = configurationFromHackathon(result.hackathon);
            activeSection = null;
        } catch (error) {
            editError =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The changes could not be saved."
                      : "Die Änderungen konnten nicht gespeichert werden.";
        } finally {
            saving = false;
        }
    }

    async function getDetailUrl() {
        return location.href;
    }

    async function resendConfirmationEmail() {
        if (confirmationEmailState === "loading") return;
        confirmationEmailState = "loading";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/confirmation-email`, {
                method: "POST",
            });
            if (!response.ok)
                throw new Error(
                    locale === "en"
                        ? "The confirmation email could not be sent."
                        : "Die Bestätigungs-E-Mail konnte nicht gesendet werden.",
                );
            confirmationEmailState = "sent";
        } catch {
            confirmationEmailState = "error";
        }
    }

    async function downloadDraft(kind: "invoice" | "deposit") {
        const loading = kind === "invoice" ? invoiceDraftState : depositDraftState;
        if (loading === "loading") return;
        if (kind === "invoice") invoiceDraftState = "loading";
        else depositDraftState = "loading";
        invoiceMessage = "";
        try {
            const response = await fetch(
                `/api/hackathons/${hackathon.id}/${kind === "invoice" ? "invoice-draft.pdf" : "down-payment-draft.pdf"}`,
                { method: "POST" },
            );
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The invoice draft could not be downloaded."
                            : "Der Rechnungsentwurf konnte nicht heruntergeladen werden."),
                );
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download =
                kind === "invoice"
                    ? `all-in-agi-rechnungsentwurf-${hackathon.id}.pdf`
                    : `all-in-agi-anzahlungsentwurf-${hackathon.id}.pdf`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
            if (kind === "invoice") invoiceDraftState = "idle";
            else depositDraftState = "idle";
        } catch (error) {
            if (kind === "invoice") invoiceDraftState = "error";
            else depositDraftState = "error";
            invoiceMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The invoice draft could not be downloaded."
                      : "Der Rechnungsentwurf konnte nicht heruntergeladen werden.";
        }
    }

    async function downloadInvoice() {
        if (invoiceDownloadState === "loading") return;
        invoiceDownloadState = "loading";
        invoiceMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/invoice.pdf`, {
                method: "POST",
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The invoice could not be downloaded."
                            : "Die Rechnung konnte nicht heruntergeladen werden."),
                );
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `all-in-agi-rechnung-${hackathon.id}.pdf`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
            invoiceIssued = true;
            if (splitBilling) invoiceKind = "final";
            invoiceDownloadState = "idle";
        } catch (error) {
            invoiceDownloadState = "error";
            invoiceMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The invoice could not be downloaded."
                      : "Die Rechnung konnte nicht heruntergeladen werden.";
        }
    }

    async function sendInvoice() {
        if (invoiceEmailState === "loading") return;
        invoiceEmailState = "loading";
        invoiceMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/invoice-email`, {
                method: "POST",
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The invoice email could not be sent."
                            : "Die Rechnungs-E-Mail konnte nicht gesendet werden."),
                );
            invoiceIssued = true;
            if (splitBilling) invoiceKind = "final";
            invoiceEmailSentAt = result.sentAt;
            invoiceEmailState = "sent";
            invoiceMessage =
                locale === "en"
                    ? "The invoice was sent by email."
                    : "Die Rechnung wurde per E-Mail gesendet.";
        } catch (error) {
            invoiceEmailState = "error";
            invoiceMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The invoice email could not be sent."
                      : "Die Rechnungs-E-Mail konnte nicht gesendet werden.";
        }
    }

    async function sendInvoiceTest() {
        if (invoiceTestState === "loading") return;
        invoiceTestState = "loading";
        invoiceMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/invoice-email-test`, {
                method: "POST",
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The test invoice email could not be sent."
                            : "Die Test-Rechnungs-E-Mail konnte nicht gesendet werden."),
                );
            invoiceTestState = "sent";
            invoiceMessage =
                locale === "en"
                    ? "Test invoice sent to go@all-in-agi.com."
                    : "Test-Rechnungs-E-Mail an go@all-in-agi.com gesendet.";
        } catch (error) {
            invoiceTestState = "error";
            invoiceMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The test invoice email could not be sent."
                      : "Die Test-Rechnungs-E-Mail konnte nicht gesendet werden.";
        }
    }

    async function downloadDownPaymentInvoice() {
        if (downPaymentDownloadState === "loading") return;
        downPaymentDownloadState = "loading";
        invoiceMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/down-payment.pdf`, {
                method: "POST",
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The deposit invoice could not be downloaded."
                            : "Die Anzahlungsrechnung konnte nicht heruntergeladen werden."),
                );
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `all-in-agi-anzahlung-${hackathon.id}.pdf`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
            downPaymentIssued = true;
            billingModel = "deposit_30";
            downPaymentDownloadState = "idle";
        } catch (error) {
            downPaymentDownloadState = "error";
            invoiceMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The deposit invoice could not be downloaded."
                      : "Die Anzahlungsrechnung konnte nicht heruntergeladen werden.";
        }
    }

    async function sendDownPaymentInvoice() {
        if (downPaymentEmailState === "loading") return;
        downPaymentEmailState = "loading";
        invoiceMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/down-payment-email`, {
                method: "POST",
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The deposit invoice could not be sent."
                            : "Die Anzahlungsrechnung konnte nicht gesendet werden."),
                );
            downPaymentIssued = true;
            billingModel = "deposit_30";
            downPaymentEmailSentAt = result.sentAt;
            downPaymentEmailState = "sent";
            invoiceMessage =
                locale === "en"
                    ? "The deposit invoice was sent by email."
                    : "Die Anzahlungsrechnung wurde per E-Mail gesendet.";
        } catch (error) {
            downPaymentEmailState = "error";
            invoiceMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The deposit invoice could not be sent."
                      : "Die Anzahlungsrechnung konnte nicht gesendet werden.";
        }
    }

    async function sendDownPaymentTest() {
        if (downPaymentTestState === "loading") return;
        downPaymentTestState = "loading";
        invoiceMessage = "";
        try {
            const response = await fetch(
                `/api/hackathons/${hackathon.id}/down-payment-email-test`,
                { method: "POST" },
            );
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The test deposit invoice could not be sent."
                            : "Die Test-Anzahlungsrechnung konnte nicht gesendet werden."),
                );
            downPaymentTestState = "sent";
            invoiceMessage =
                locale === "en"
                    ? "Test deposit invoice sent to go@all-in-agi.com."
                    : "Test-Anzahlungsrechnung an go@all-in-agi.com gesendet.";
        } catch (error) {
            downPaymentTestState = "error";
            invoiceMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The test deposit invoice could not be sent."
                      : "Die Test-Anzahlungsrechnung konnte nicht gesendet werden.";
        }
    }

    async function markDownPaymentReceived() {
        if (downPaymentPaidBusy || downPaymentPaidAt) return;
        downPaymentPaidBusy = true;
        invoiceMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/down-payment-paid`, {
                method: "POST",
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "The payment could not be saved."
                            : "Der Zahlungseingang konnte nicht gespeichert werden."),
                );
            downPaymentPaidAt = result.paidAt;
            invoiceMessage =
                locale === "en"
                    ? "The payment was saved."
                    : "Der Zahlungseingang wurde gespeichert.";
        } catch (error) {
            invoiceMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "The payment could not be saved."
                      : "Der Zahlungseingang konnte nicht gespeichert werden.";
        } finally {
            downPaymentPaidBusy = false;
        }
    }

    async function cancelBooking() {
        if (cancellationBusy) return;
        cancellationBusy = true;
        cancellationMessage = "";
        try {
            const response = await fetch(`/api/hackathons/${hackathon.id}/cancel`, {
                method: "POST",
            });
            const result = await response.json();
            if (!response.ok && response.status !== 202)
                throw new Error(
                    result.message ??
                        (locale === "en"
                            ? "Cancellation could not be started."
                            : "Die Stornierung konnte nicht gestartet werden."),
                );
            hackathon = {
                ...hackathon,
                status: result.status,
                cancelledAt:
                    result.status === "cancelled"
                        ? (hackathon.cancelledAt ?? new Date().toISOString())
                        : hackathon.cancelledAt,
                cancellationEmailSentAt: result.emailSent
                    ? (hackathon.cancellationEmailSentAt ?? new Date().toISOString())
                    : hackathon.cancellationEmailSentAt,
            };
            cancellationMessage = result.complete
                ? locale === "en"
                    ? "The booking was cancelled and the customer notified."
                    : "Die Buchung wurde storniert und der Kunde benachrichtigt."
                : (result.message ??
                  (locale === "en"
                      ? "Cancellation is not complete yet. Please try again."
                      : "Die Stornierung ist noch nicht vollständig. Bitte versuchen Sie es erneut."));
            cancelDialogOpen = false;
            await invalidateAll();
        } catch (error) {
            cancellationMessage =
                error instanceof Error
                    ? error.message
                    : locale === "en"
                      ? "Cancellation could not be started."
                      : "Die Stornierung konnte nicht gestartet werden.";
        } finally {
            cancellationBusy = false;
        }
    }
</script>

<svelte:head>
    <title
        >{locale === "en" ? "Hackathon for" : "Hackathon für"}
        {hackathon.companyName} — ALL IN AGI</title
    >
</svelte:head>

<div class:detail-readonly={readOnly} class="success-page detail-page">
    <div class="success-layout detail-layout">
        <div class="success-map detail-map">
            <MapPreview
                latitude={hackathon.address.latitude}
                longitude={hackathon.address.longitude}
                {locale}
            >
                <article class="event-card">
                    <div class="event-card-top">
                        <h2>{hackathon.companyName}</h2>
                        <div class="event-card-price">
                            {formatPrice(hackathon.price.totalPrice, locale)}
                        </div>
                    </div>
                    {#if eventAddressLabel}<p class="event-address">
                            {hackathon.venueProvided
                                ? eventAddressLabel
                                : `${locale === "en" ? "Search area" : "Suchgebiet"}: ${eventAddressLabel}`}
                        </p>{/if}
                    <div class="event-details">
                        <div class="event-detail">
                            <small>{locale === "en" ? "Event date" : "Veranstaltungsdatum"}</small
                            ><b
                                >{formatEventTimeRange(
                                    hackathon.eventStart,
                                    hackathon.eventEnd,
                                    locale,
                                )}</b
                            >
                        </div>
                        <div class="event-detail">
                            <small>Team</small><b
                                >{locale === "en" ? "Up to" : "Bis"}
                                {hackathon.capacity}
                                {locale === "en" ? "people" : "Personen"}</b
                            >
                        </div>
                        <div class="event-detail">
                            <small>{locale === "en" ? "Location" : "Ort"}</small><b
                                >{hackathon.venueProvided
                                    ? locale === "en"
                                        ? "Your venue"
                                        : "Eigener Raum"
                                    : locale === "en"
                                      ? "To be confirmed"
                                      : "Wird bestätigt"}</b
                            >
                        </div>
                        <div class="event-detail"><small>Screen</small><b>{equipmentLabel}</b></div>
                    </div>
                </article>
            </MapPreview>
        </div>

        <section class="success-panel detail-panel" aria-labelledby="detail-title">
            <div class="success-mark"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></div>
            <h1 id="detail-title">
                {locale === "en" ? "Hackathon for" : "Hackathon für"}
                {hackathon.companyName}
            </h1>
            <p class="success-date">
                {formatEventTimeRange(hackathon.eventStart, hackathon.eventEnd, locale)}
            </p>
            {#if hackathon.status === "cancelled"}
                <div class="booking-state-banner cancelled" role="status">
                    <Ban size={18} aria-hidden="true" /><span
                        ><strong
                            >{locale === "en" ? "Booking cancelled" : "Buchung storniert"}</strong
                        >{locale === "en"
                            ? "The calendar reservations have been cancelled."
                            : "Die Kalendertermine wurden aufgehoben."}</span
                    >
                </div>
            {:else if hackathon.status === "cancellation_pending"}
                <div class="booking-state-banner pending" role="status">
                    <RotateCcw size={18} aria-hidden="true" /><span
                        ><strong
                            >{locale === "en"
                                ? "Cancellation in progress"
                                : "Stornierung in Bearbeitung"}</strong
                        >{locale === "en"
                            ? "At least one step still needs to be completed."
                            : "Mindestens ein Schritt muss noch abgeschlossen werden."}</span
                    >
                </div>
            {:else if hackathon.status === "prep_scheduled"}
                <div class="booking-state-banner request-pending" role="status">
                    <Clock3 size={28} strokeWidth={1.7} aria-hidden="true" />
                    <strong
                        >{locale === "en"
                            ? "Non-binding request"
                            : "Unverbindliche Anfrage"}</strong
                    >
                    <p>
                        {hackathon.eventStart
                            ? locale === "en"
                                ? "The preparation call and hackathon day are reserved. No contract has been concluded yet."
                                : "Preparation Call und Hackathontag sind reserviert. Ein Vertrag ist noch nicht geschlossen."
                            : locale === "en"
                              ? "The preparation call is reserved. The hackathon date will be selected later."
                              : "Der Preparation Call ist reserviert. Der Hackathon-Termin wird später festgelegt."}
                    </p>
                </div>
            {:else if hackathon.status === "exit_window"}
                <div class="booking-state-banner request-pending" role="status">
                    <Clock3 size={28} strokeWidth={1.7} aria-hidden="true" />
                    <strong>{locale === "en" ? "Contract concluded" : "Vertrag geschlossen"}</strong
                    >
                    <p>
                        {locale === "en"
                            ? `Free withdrawal until ${hackathon.exitDeadline ? new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(hackathon.exitDeadline)) : "deadline being calculated"}.`
                            : `Kostenfreier Rücktritt bis ${hackathon.exitDeadline ? new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(hackathon.exitDeadline)) : "Fristende wird berechnet"}.`}
                    </p>
                </div>
            {:else if hackathon.status === "contracted"}
                <div class="booking-state-banner" role="status">
                    <Check size={18} aria-hidden="true" /><span
                        ><strong
                            >{locale === "en" ? "Contract binding" : "Vertrag verbindlich"}</strong
                        >{locale === "en"
                            ? "The free mutual exit window has ended."
                            : "Die kostenlose beiderseitige Lösungsfrist ist abgelaufen."}</span
                    >
                </div>
            {:else if hackathon.status === "withdrawn"}
                <div class="booking-state-banner cancelled" role="status">
                    <Ban size={18} aria-hidden="true" /><span
                        ><strong
                            >{locale === "en"
                                ? "Withdrawn free of charge"
                                : "Kostenfrei zurückgetreten"}</strong
                        >{locale === "en"
                            ? "The contract was ended within the exit window."
                            : "Der Vertrag wurde innerhalb der Lösungsfrist beendet."}</span
                    >
                </div>
            {:else if hackathon.status === "completed"}
                <div class="booking-state-banner" role="status">
                    <Check size={18} aria-hidden="true" /><span
                        ><strong>{locale === "en" ? "Completed" : "Durchgeführt"}</strong
                        >{locale === "en"
                            ? "The hackathon has been completed."
                            : "Der Hackathon wurde abgeschlossen."}</span
                    >
                </div>
            {/if}

            <MiniContactCards {locale} />
            <div class="success-actions">
                <SharePlanButton
                    getUrl={getDetailUrl}
                    label={locale === "en" ? "Share hackathon" : "Hackathon teilen"}
                    {locale}
                />
                <a
                    class="button-primary action-button"
                    href={`/api/hackathons/${hackathon.id}/plan.pdf`}
                >
                    <Download size={18} aria-hidden="true" />{locale === "en"
                        ? "Download plan"
                        : "Plan herunterladen"}
                </a>
                {#if !readOnly}
                    <a
                        class="button-secondary action-button"
                        href={`/api/hackathons/${hackathon.id}/prep-call.ics`}
                    >
                        <CalendarPlus size={18} aria-hidden="true" />{locale === "en"
                            ? "Add calendar event"
                            : "Kalenderereignis hinzufügen"}
                    </a>
                    <button
                        class="button-secondary action-button"
                        type="button"
                        onclick={resendConfirmationEmail}
                        disabled={confirmationEmailState === "loading"}
                        aria-live="polite"
                    >
                        {#if confirmationEmailState === "sent"}
                            <Check size={18} aria-hidden="true" />{locale === "en"
                                ? "Confirmation email sent"
                                : "Bestätigungs-E-Mail gesendet"}
                        {:else}
                            <Mail size={18} aria-hidden="true" />{locale === "en"
                                ? confirmationEmailState === "loading"
                                    ? "Sending email …"
                                    : confirmationEmailState === "error"
                                      ? "Try sending again"
                                      : "Send confirmation email"
                                : confirmationEmailState === "loading"
                                  ? "E-Mail wird gesendet …"
                                  : confirmationEmailState === "error"
                                    ? "Senden erneut versuchen"
                                    : "Bestätigungs-E-Mail senden"}
                        {/if}
                    </button>
                    {#if data.admin.authorized && hackathon.status === "prep_scheduled"}
                        <button
                            class="button-secondary action-button"
                            type="button"
                            onclick={() => openAgreementModal("test")}
                            disabled={contractBusy || contractTestEmailState === "loading"}
                            aria-live="polite"
                        >
                            <Mail
                                size={18}
                                aria-hidden="true"
                            />{#if contractTestEmailState === "loading"}{locale === "en"
                                    ? "Sending test email …"
                                    : "Test-E-Mail wird gesendet …"}{:else if contractTestEmailState === "error"}{locale ===
                                "en"
                                    ? "Try test again"
                                    : "Test erneut versuchen"}{:else if contractTestEmailState === "sent"}{locale ===
                                "en"
                                    ? "Test contract email sent"
                                    : "Test-Vertrags-E-Mail gesendet"}{:else}{locale === "en"
                                    ? "Send contract email as test to me"
                                    : "Vertrags-E-Mail als Test an mich senden"}{/if}
                        </button>
                    {/if}
                {/if}
            </div>

            {#if data.admin.authorized}
                <div
                    class="admin-detail-actions"
                    aria-label={locale === "en" ? "Admin actions" : "Admin-Aktionen"}
                >
                    {#if invoiceDraftAvailable}
                        {#if splitBilling}
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    {#snippet child({ props })}
                                        <button
                                            {...props}
                                            class="button-secondary action-button"
                                            type="button"
                                            disabled={invoiceDraftState === "loading" ||
                                                depositDraftState === "loading"}
                                        >
                                            <Download size={18} aria-hidden="true" />
                                            {locale === "en" ? "Invoice draft" : "Rechnungsentwurf"}
                                        </button>
                                    {/snippet}
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content
                                    class="min-w-[280px]"
                                    align="end"
                                    sideOffset={6}
                                >
                                    <DropdownMenu.Item
                                        disabled={depositDraftState === "loading"}
                                        onSelect={() => downloadDraft("deposit")}
                                    >
                                        <Download size={16} aria-hidden="true" />
                                        {depositDraftState === "loading"
                                            ? locale === "en"
                                                ? "Creating deposit draft …"
                                                : "Anzahlungsentwurf wird erstellt …"
                                            : depositDraftState === "error"
                                              ? locale === "en"
                                                  ? "Try deposit draft again"
                                                  : "Anzahlungsentwurf erneut versuchen"
                                              : locale === "en"
                                                ? "Download deposit invoice draft"
                                                : "Anzahlungsentwurf herunterladen"}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        disabled={invoiceDraftState === "loading"}
                                        onSelect={() => downloadDraft("invoice")}
                                    >
                                        <Download size={16} aria-hidden="true" />
                                        {invoiceDraftState === "loading"
                                            ? locale === "en"
                                                ? "Creating invoice draft …"
                                                : "Rechnungsentwurf wird erstellt …"
                                            : invoiceDraftState === "error"
                                              ? locale === "en"
                                                  ? "Try invoice draft again"
                                                  : "Rechnungsentwurf erneut versuchen"
                                              : locale === "en"
                                                ? "Download invoice draft"
                                                : "Rechnungsentwurf herunterladen"}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        {:else}
                            <button
                                class="button-secondary action-button"
                                type="button"
                                onclick={() => downloadDraft("invoice")}
                                disabled={invoiceDraftState === "loading"}
                            >
                                <Download size={18} aria-hidden="true" />
                                {invoiceDraftState === "loading"
                                    ? locale === "en"
                                        ? "Creating invoice draft …"
                                        : "Rechnungsentwurf wird erstellt …"
                                    : invoiceDraftState === "error"
                                      ? locale === "en"
                                          ? "Try invoice draft again"
                                          : "Rechnungsentwurf erneut versuchen"
                                      : locale === "en"
                                        ? "Invoice draft"
                                        : "Rechnungsentwurf"}
                            </button>
                        {/if}
                    {/if}
                    {#if hackathon.status === "prep_scheduled"}
                        {#if !billingComplete}<p class="admin-action-message">
                                {locale === "en"
                                    ? "Billing details must be complete before recording the agreement."
                                    : "Vor der Zustimmung müssen die Rechnungsdaten vollständig hinterlegt werden."}
                            </p>{/if}
                        <button
                            class="button-primary action-button"
                            type="button"
                            onclick={() => openAgreementModal("record")}
                            disabled={contractBusy || !billingComplete}
                            >{locale === "en"
                                ? "Document mutual agreement"
                                : "Beiderseitige Zustimmung dokumentieren"}</button
                        >
                    {:else if hackathon.status === "exit_window"}
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                {#snippet child({ props })}
                                    <button
                                        {...props}
                                        class="button-secondary action-button"
                                        type="button"
                                        disabled={contractBusy}
                                    >
                                        <Undo2 size={18} aria-hidden="true" />
                                        {locale === "en"
                                            ? "Record withdrawal"
                                            : "Rücktritt erfassen"}
                                    </button>
                                {/snippet}
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content class="min-w-[280px]" align="end" sideOffset={6}>
                                <DropdownMenu.Item
                                    disabled={contractBusy}
                                    onSelect={() => withdrawDuringExitWindow("customer")}
                                >
                                    <UserRoundX size={16} aria-hidden="true" />
                                    {locale === "en"
                                        ? "Record customer withdrawal"
                                        : "Rücktritt Kunde erfassen"}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    disabled={contractBusy}
                                    onSelect={() => withdrawDuringExitWindow("organizer")}
                                >
                                    <Building2 size={16} aria-hidden="true" />
                                    {locale === "en"
                                        ? "Record ALL IN AGI withdrawal"
                                        : "Rücktritt ALL IN AGI erfassen"}
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    {:else if hackathon.status === "contracted" && hackathon.eventEnd && new Date() >= new Date(hackathon.eventEnd)}
                        <button
                            class="button-secondary action-button"
                            type="button"
                            onclick={completeContract}
                            disabled={contractBusy}
                            >{locale === "en"
                                ? "Mark as completed"
                                : "Durchführung abschließen"}</button
                        >
                    {/if}
                    {#if invoiceIssued || (invoiceEligible && finalInvoiceAvailable)}
                        <InvoiceActionsMenu
                            label={invoiceIsFinal
                                ? locale === "en"
                                    ? "Final invoice"
                                    : "Endrechnung"
                                : locale === "en"
                                  ? "Invoice"
                                  : "Rechnung"}
                            downloadLabel={invoiceDownloadState === "loading"
                                ? locale === "en"
                                    ? "Creating invoice …"
                                    : "Rechnung wird erstellt …"
                                : invoiceDownloadState === "error"
                                  ? locale === "en"
                                      ? "Try download again"
                                      : "Download erneut versuchen"
                                  : invoiceIsFinal
                                    ? locale === "en"
                                        ? "Download final invoice"
                                        : "Endrechnung herunterladen"
                                    : locale === "en"
                                      ? "Download invoice"
                                      : "Rechnung herunterladen"}
                            sendLabel={invoiceEmailState === "loading"
                                ? locale === "en"
                                    ? "Sending invoice …"
                                    : "Rechnung wird gesendet …"
                                : invoiceEmailState === "error"
                                  ? locale === "en"
                                      ? "Try sending again"
                                      : "Senden erneut versuchen"
                                  : invoiceEmailSentAt || invoiceEmailState === "sent"
                                    ? invoiceIsFinal
                                        ? locale === "en"
                                            ? "Resend final invoice"
                                            : "Endrechnung erneut senden"
                                        : locale === "en"
                                          ? "Resend invoice"
                                          : "Rechnung erneut senden"
                                    : invoiceIsFinal
                                      ? locale === "en"
                                          ? "Send final invoice"
                                          : "Endrechnung senden"
                                      : locale === "en"
                                        ? "Send invoice"
                                        : "Rechnung senden"}
                            testLabel={invoiceTestState === "loading"
                                ? locale === "en"
                                    ? "Sending test invoice …"
                                    : "Test-Rechnung wird gesendet …"
                                : invoiceTestState === "error"
                                  ? locale === "en"
                                      ? "Try test again"
                                      : "Test erneut versuchen"
                                  : invoiceTestState === "sent"
                                    ? locale === "en"
                                        ? "Test invoice sent"
                                        : "Test-Rechnung gesendet"
                                    : locale === "en"
                                      ? "Send invoice as test to me"
                                      : "Rechnung als Test an mich senden"}
                            downloadDisabled={invoiceDownloadState === "loading"}
                            sendDisabled={invoiceEmailState === "loading" ||
                                !(invoiceEligible && finalInvoiceAvailable)}
                            testDisabled={invoiceTestState === "loading"}
                            onDownload={downloadInvoice}
                            onSend={sendInvoice}
                            onTest={sendInvoiceTest}
                        />
                    {/if}
                    {#if showDepositInvoice}
                        <InvoiceActionsMenu
                            label={locale === "en" ? "Deposit invoice" : "Anzahlungsrechnung"}
                            downloadLabel={downPaymentDownloadState === "loading"
                                ? locale === "en"
                                    ? "Creating deposit invoice …"
                                    : "Anzahlungsrechnung wird erstellt …"
                                : downPaymentDownloadState === "error"
                                  ? locale === "en"
                                      ? "Try download again"
                                      : "Download erneut versuchen"
                                  : locale === "en"
                                    ? "Download deposit invoice"
                                    : "Anzahlungsrechnung herunterladen"}
                            sendLabel={downPaymentEmailState === "loading"
                                ? locale === "en"
                                    ? "Sending deposit invoice …"
                                    : "Anzahlungsrechnung wird gesendet …"
                                : downPaymentEmailState === "error"
                                  ? locale === "en"
                                      ? "Try sending again"
                                      : "Senden erneut versuchen"
                                  : downPaymentEmailSentAt || downPaymentEmailState === "sent"
                                    ? locale === "en"
                                        ? "Resend deposit invoice"
                                        : "Anzahlungsrechnung erneut senden"
                                    : locale === "en"
                                      ? "Send deposit invoice"
                                      : "Anzahlungsrechnung senden"}
                            testLabel={downPaymentTestState === "loading"
                                ? locale === "en"
                                    ? "Sending test deposit invoice …"
                                    : "Test-Anzahlungsrechnung wird gesendet …"
                                : downPaymentTestState === "error"
                                  ? locale === "en"
                                      ? "Try test again"
                                      : "Test erneut versuchen"
                                  : downPaymentTestState === "sent"
                                    ? locale === "en"
                                        ? "Test deposit invoice sent"
                                        : "Test-Anzahlungsrechnung gesendet"
                                    : locale === "en"
                                      ? "Send deposit invoice as test to me"
                                      : "Anzahlungsrechnung als Test an mich senden"}
                            downloadDisabled={downPaymentDownloadState === "loading"}
                            sendDisabled={downPaymentEmailState === "loading" || !invoiceEligible}
                            testDisabled={downPaymentTestState === "loading"}
                            onDownload={downloadDownPaymentInvoice}
                            onSend={sendDownPaymentInvoice}
                            onTest={sendDownPaymentTest}
                        />
                        {#if downPaymentIssued}
                            <button
                                class="button-secondary action-button"
                                type="button"
                                onclick={markDownPaymentReceived}
                                disabled={downPaymentPaidBusy || Boolean(downPaymentPaidAt)}
                            >
                                <Check
                                    size={18}
                                    aria-hidden="true"
                                />{#if downPaymentPaidBusy}{locale === "en"
                                        ? "Saving …"
                                        : "Wird gespeichert …"}{:else}{locale === "en"
                                        ? "Payment received"
                                        : "Zahlung eingegangen"}{/if}
                            </button>
                        {/if}
                        {#if downPaymentPaidAt && !invoiceIssued && !finalInvoiceAvailable}<p
                                class="admin-action-message"
                            >
                                {locale === "en"
                                    ? "Final invoice available after the hackathon."
                                    : "Endrechnung nach dem Hackathon verfügbar."}
                            </p>{/if}
                    {/if}
                    {#if cancellableContract && hackathon.eventStart && hackathon.eventEnd}
                        <AlertDialog.Root bind:open={cancelDialogOpen}>
                            <AlertDialog.Trigger class="button-primary action-button"
                                ><Ban size={18} aria-hidden="true" />{locale === "en"
                                    ? "Cancel booking"
                                    : "Buchung stornieren"}</AlertDialog.Trigger
                            >
                            <AlertDialog.Portal>
                                <AlertDialog.Overlay class="confirmation-overlay" />
                                <AlertDialog.Content class="confirmation-dialog">
                                    <div class="confirmation-dialog-icon">
                                        <Ban size={24} aria-hidden="true" />
                                    </div>
                                    <AlertDialog.Title
                                        >{locale === "en"
                                            ? "Really cancel booking?"
                                            : "Booking wirklich stornieren?"}</AlertDialog.Title
                                    >
                                    <AlertDialog.Description
                                        >{locale === "en"
                                            ? `The hackathon day and preparation call will be cancelled in Cal.com. ${hackathon.contactName} will then receive a cancellation email.`
                                            : `Der Hackathontag und der Preparation Call werden bei Cal.com storniert. Anschließend erhält ${hackathon.contactName} eine Stornierungs-E-Mail.`}</AlertDialog.Description
                                    >
                                    <div class="confirmation-dialog-actions">
                                        <AlertDialog.Cancel class="button-secondary"
                                            >{locale === "en"
                                                ? "Cancel"
                                                : "Abbrechen"}</AlertDialog.Cancel
                                        >
                                        <AlertDialog.Action
                                            class="button-primary"
                                            onclick={cancelBooking}
                                            >{locale === "en"
                                                ? "Cancel booking"
                                                : "Buchung stornieren"}</AlertDialog.Action
                                        >
                                    </div>
                                </AlertDialog.Content>
                            </AlertDialog.Portal>
                        </AlertDialog.Root>
                    {:else if cancellableContract}
                        <p class="admin-action-message">
                            {locale === "en"
                                ? "Set the hackathon date before cancelling this contracted booking."
                                : "Legen Sie vor der Stornierung dieser vertraglichen Buchung den Hackathon-Termin fest."}
                        </p>
                    {:else if ["requested", "prep_scheduled", "cancellation_pending", "cancelled"].includes(hackathon.status) && !hackathon.cancellationEmailSentAt}
                        <button
                            class="button-primary action-button"
                            type="button"
                            onclick={cancelBooking}
                            disabled={cancellationBusy}
                        >
                            <RotateCcw
                                size={18}
                                aria-hidden="true"
                            />{#if cancellationBusy}{locale === "en"
                                    ? "Working …"
                                    : "Wird bearbeitet …"}{:else if hackathon.status === "cancelled"}{locale ===
                                "en"
                                    ? "Resend email"
                                    : "E-Mail erneut senden"}{:else if hackathon.status === "cancellation_pending"}{locale ===
                                "en"
                                    ? "Continue cancellation"
                                    : "Stornierung fortsetzen"}{:else}{locale === "en"
                                    ? "Cancel booking"
                                    : "Buchung stornieren"}{/if}
                        </button>
                    {/if}
                    {#if invoiceMessage}<p class="admin-action-message" role="status">
                            {invoiceMessage}
                        </p>{/if}
                    {#if contractMessage}<p class="admin-action-message" role="status">
                            {contractMessage}
                        </p>{/if}
                    {#if cancellationMessage}<p class="admin-action-message" role="status">
                            {cancellationMessage}
                        </p>{/if}
                </div>

                <AlertDialog.Root bind:open={agreementModalOpen}>
                    <AlertDialog.Portal>
                        <AlertDialog.Overlay class="confirmation-overlay" />
                        <AlertDialog.Content class="confirmation-dialog agreement-dialog">
                            <AlertDialog.Title>
                                {agreementModalMode === "test"
                                    ? locale === "en"
                                        ? "Send test contract email"
                                        : "Test-Vertrags-E-Mail senden"
                                    : locale === "en"
                                      ? "Document mutual agreement"
                                      : "Beiderseitige Zustimmung dokumentieren"}
                            </AlertDialog.Title>
                            <AlertDialog.Description>
                                {agreementModalMode === "test"
                                    ? locale === "en"
                                        ? "The email is only sent to go@all-in-agi.com with a [TEST] subject prefix. The booking status stays unchanged."
                                        : "Die E-Mail wird nur an go@all-in-agi.com mit dem Betreffpräfix [TEST] gesendet. Der Buchungsstatus bleibt unverändert."
                                    : locale === "en"
                                      ? "Saving closes the contract and sends the contract confirmation to the customer."
                                      : "Nach dem Speichern wird der Vertrag geschlossen und die Vertragsbestätigung an den Kunden gesendet."}
                            </AlertDialog.Description>
                            <div class="contract-admin-form agreement-dialog-fields">
                                <div class="field">
                                    <label for="agreement-customer"
                                        >{locale === "en"
                                            ? "Agreeing person (customer)"
                                            : "Zustimmende Person Kunde"}</label
                                    ><input
                                        id="agreement-customer"
                                        bind:value={agreementCustomerName}
                                    />
                                </div>
                                <div class="field">
                                    <label for="agreement-organizer"
                                        >{locale === "en"
                                            ? "Agreeing person (ALL IN AGI)"
                                            : "Zustimmende Person ALL IN AGI"}</label
                                    ><input
                                        id="agreement-organizer"
                                        bind:value={agreementOrganizerName}
                                    />
                                </div>
                            </div>
                            <div class="confirmation-dialog-actions">
                                <AlertDialog.Cancel class="button-secondary"
                                    >{locale === "en" ? "Cancel" : "Abbrechen"}</AlertDialog.Cancel
                                >
                                <button
                                    class="button-primary"
                                    type="button"
                                    onclick={submitAgreementModal}
                                    disabled={contractBusy ||
                                        !agreementCustomerName.trim() ||
                                        !agreementOrganizerName.trim() ||
                                        (agreementModalMode === "record" && !billingComplete)}
                                >
                                    {agreementModalMode === "test"
                                        ? contractBusy
                                            ? locale === "en"
                                                ? "Sending …"
                                                : "Wird gesendet …"
                                            : locale === "en"
                                              ? "Send test"
                                              : "Test senden"
                                        : contractBusy
                                          ? locale === "en"
                                              ? "Saving …"
                                              : "Wird gespeichert …"
                                          : locale === "en"
                                            ? "Save agreement"
                                            : "Zustimmung speichern"}
                                </button>
                            </div>
                        </AlertDialog.Content>
                    </AlertDialog.Portal>
                </AlertDialog.Root>
            {/if}

            <div class="summary-box overview-box detail-overview">
                <EditableSummaryRow
                    icon={Building2}
                    label={locale === "en" ? "Company" : "Unternehmen"}
                    value={hackathon.companyName}
                    status={locale === "en" ? "Saved" : "Gespeichert"}
                    active={activeSection === "company"}
                    {saving}
                    error={activeSection === "company" ? editError : ""}
                    onedit={() => openEditor("company")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}<div class="field">
                            <label for="detail-company"
                                >{locale === "en" ? "Company" : "Unternehmen"}</label
                            ><input
                                id="detail-company"
                                autocomplete="organization"
                                value={draft.companyName}
                                oninput={(event) =>
                                    (draft = { ...draft, companyName: event.currentTarget.value })}
                            />
                        </div>{/snippet}
                </EditableSummaryRow>
                <EditableSummaryRow
                    icon={Contact}
                    label={locale === "en" ? "Contact" : "Kontakt"}
                    value={hackathon.contactName}
                    secondaryValues={[hackathon.email, hackathon.phone]}
                    status={locale === "en" ? "Saved" : "Gespeichert"}
                    active={activeSection === "contact"}
                    {saving}
                    error={activeSection === "contact" ? editError : ""}
                    onedit={() => openEditor("contact")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}<ContactFields
                            companyName={draft.companyName}
                            contactName={draft.contactName}
                            email={draft.email}
                            phone={draft.phone}
                            showCompany={false}
                            idPrefix="detail-contact"
                            {locale}
                            onchange={(patch) => (draft = { ...draft, ...patch })}
                        />{/snippet}
                </EditableSummaryRow>
                <EditableSummaryRow
                    icon={ReceiptEuro}
                    label={locale === "en" ? "Billing details" : "Rechnungsdaten"}
                    value={hackathon.billing
                        ? `${hackathon.billing.companyName}${hackathon.billing.legalForm ? ` ${hackathon.billing.legalForm}` : ""}`
                        : billingComplete
                          ? billingForContract.companyName
                          : locale === "en"
                            ? "Not provided yet"
                            : "Noch nicht hinterlegt"}
                    secondaryValues={hackathon.billing
                        ? [hackathon.billing.email]
                        : billingComplete
                          ? [billingForContract.email]
                          : []}
                    status={billingComplete
                        ? locale === "en"
                            ? "Complete"
                            : "Vollständig"
                        : locale === "en"
                          ? "Required before contract"
                          : "Vor Vertragsschluss erforderlich"}
                    active={activeSection === "billing"}
                    {saving}
                    error={activeSection === "billing" ? editError : ""}
                    onedit={() => openEditor("billing")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}
                        <div class="field-grid billing-fields">
                            <div class="field">
                                <label for="detail-billing-company"
                                    >{locale === "en" ? "Company" : "Firma"}</label
                                ><input
                                    id="detail-billing-company"
                                    autocomplete="organization"
                                    value={draft.billing!.companyName}
                                    oninput={(event) =>
                                        updateDraftBilling({
                                            companyName: event.currentTarget.value,
                                        })}
                                />
                            </div>
                            <div class="field">
                                <label for="detail-billing-legal-form"
                                    >{locale === "en" ? "Legal form" : "Rechtsform"}
                                    <small>({locale === "en" ? "optional" : "optional"})</small
                                    ></label
                                ><input
                                    id="detail-billing-legal-form"
                                    placeholder={locale === "en" ? "e.g. Ltd" : "z. B. GmbH"}
                                    value={draft.billing!.legalForm}
                                    oninput={(event) =>
                                        updateDraftBilling({
                                            legalForm: event.currentTarget.value,
                                        })}
                                />
                            </div>
                            <div class="field">
                                <label for="detail-billing-contact"
                                    >{locale === "en"
                                        ? "Billing contact"
                                        : "Rechnungskontakt"}</label
                                ><input
                                    id="detail-billing-contact"
                                    autocomplete="name"
                                    value={draft.billing!.contactName}
                                    oninput={(event) =>
                                        updateDraftBilling({
                                            contactName: event.currentTarget.value,
                                        })}
                                />
                            </div>
                            <div class="field">
                                <label for="detail-billing-email"
                                    >{locale === "en" ? "Billing email" : "Rechnungs-E-Mail"}</label
                                ><input
                                    id="detail-billing-email"
                                    type="email"
                                    autocomplete="email"
                                    value={draft.billing!.email}
                                    oninput={(event) =>
                                        updateDraftBilling({ email: event.currentTarget.value })}
                                />
                            </div>
                            <div class="field full">
                                <label for="detail-billing-street"
                                    >{locale === "en"
                                        ? "Street and number"
                                        : "Straße und Hausnummer"}</label
                                ><input
                                    id="detail-billing-street"
                                    autocomplete="billing street-address"
                                    value={draft.billing!.address.street}
                                    oninput={(event) =>
                                        updateDraftBillingAddress({
                                            street: event.currentTarget.value,
                                        })}
                                />
                            </div>
                            <div class="field">
                                <label for="detail-billing-postal"
                                    >{locale === "en" ? "Postal code" : "Postleitzahl"}</label
                                ><input
                                    id="detail-billing-postal"
                                    autocomplete="billing postal-code"
                                    value={draft.billing!.address.postalCode}
                                    oninput={(event) =>
                                        updateDraftBillingAddress({
                                            postalCode: event.currentTarget.value,
                                        })}
                                />
                            </div>
                            <div class="field">
                                <label for="detail-billing-city"
                                    >{locale === "en" ? "City" : "Ort"}</label
                                ><input
                                    id="detail-billing-city"
                                    autocomplete="billing address-level2"
                                    value={draft.billing!.address.city}
                                    oninput={(event) =>
                                        updateDraftBillingAddress({
                                            city: event.currentTarget.value,
                                        })}
                                />
                            </div>
                            <div class="field">
                                <label for="detail-billing-vat"
                                    >{locale === "en" ? "VAT ID" : "USt-IdNr."}
                                    <small>({locale === "en" ? "optional" : "optional"})</small
                                    ></label
                                ><input
                                    id="detail-billing-vat"
                                    value={draft.billing!.vatId}
                                    oninput={(event) =>
                                        updateDraftBilling({ vatId: event.currentTarget.value })}
                                />
                            </div>
                            <div class="field">
                                <label for="detail-billing-po"
                                    >{locale === "en" ? "Purchase order" : "Bestellnummer"}
                                    <small>({locale === "en" ? "optional" : "optional"})</small
                                    ></label
                                ><input
                                    id="detail-billing-po"
                                    value={draft.billing!.purchaseOrder}
                                    oninput={(event) =>
                                        updateDraftBilling({
                                            purchaseOrder: event.currentTarget.value,
                                        })}
                                />
                            </div>
                        </div>
                    {/snippet}
                </EditableSummaryRow>
                <EditableSummaryRow
                    icon={MessageSquareText}
                    label={locale === "en" ? "Your message" : "Ihre Nachricht"}
                    value={hackathon.message ||
                        (locale === "en" ? "No message provided" : "Keine Nachricht hinterlegt")}
                    status={hackathon.message
                        ? locale === "en"
                            ? "Provided"
                            : "Vorhanden"
                        : locale === "en"
                          ? "Optional"
                          : "Optional"}
                    active={activeSection === "message"}
                    {saving}
                    error={activeSection === "message" ? editError : ""}
                    onedit={() => openEditor("message")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}<MessageField
                            value={draft.message}
                            onchange={(message) => (draft = { ...draft, message })}
                            id="detail-message"
                            {locale}
                        />{/snippet}
                </EditableSummaryRow>
                <EditableSummaryRow
                    icon={Users}
                    label={overviewRow("team").label}
                    value={overviewRow("team").value}
                    status={overviewRow("team").status}
                    active={activeSection === "capacity"}
                    {saving}
                    error={activeSection === "capacity" ? editError : ""}
                    onedit={() => openEditor("capacity")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}<ConfigOptionCards
                            kind="capacity"
                            values={draftOptions}
                            onchange={updateDraftOptions}
                            idPrefix="detail-capacity"
                            {locale}
                        />{/snippet}
                </EditableSummaryRow>
                {#if standardOffer}
                    <EditableSummaryRow
                        icon={MapPin}
                        label={locale === "en" ? "Venue" : "Veranstaltungsort"}
                        value={locale === "en" ? "Customer premises" : "Räume des Kunden"}
                        status={locale === "en" ? "Required" : "Vorausgesetzt"}
                    />
                {:else}
                    <EditableSummaryRow
                        icon={MapPin}
                        label={overviewRow("location").label}
                        value={overviewRow("location").value}
                        status={overviewRow("location").status}
                        active={activeSection === "venue"}
                        {saving}
                        error={activeSection === "venue" ? editError : ""}
                        onedit={() => openEditor("venue")}
                        onsave={saveEditor}
                        oncancel={cancelEditor}
                    >
                        {#snippet editor()}<ConfigOptionCards
                                kind="venue"
                                values={draftOptions}
                                onchange={updateDraftOptions}
                                idPrefix="detail-venue"
                                {locale}
                            />{/snippet}
                    </EditableSummaryRow>
                {/if}
                <EditableSummaryRow
                    icon={MapPinned}
                    label={hackathon.venueProvided
                        ? locale === "en"
                            ? "Event address"
                            : "Veranstaltungsadresse"
                        : locale === "en"
                          ? "Preferred search area"
                          : "Gewünschtes Suchgebiet"}
                    value={eventAddressLabel}
                    status={hackathon.venueProvided
                        ? locale === "en"
                            ? "Planned"
                            : "Geplant"
                        : locale === "en"
                          ? "Location to be confirmed"
                          : "Location wird bestätigt"}
                    active={activeSection === "address"}
                    {saving}
                    error={activeSection === "address" ? editError : ""}
                    onedit={() => openEditor("address")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}<AddressEditor
                            value={draft.address}
                            onchange={(address) => (draft = { ...draft, address })}
                            idPrefix="detail-address"
                            searchArea={!draft.venueProvided}
                            {locale}
                        />{/snippet}
                </EditableSummaryRow>
                <EditableSummaryRow
                    icon={Code2}
                    label={overviewRow("tools").label}
                    value={overviewRow("tools").value}
                    status={overviewRow("tools").status}
                    active={activeSection === "tools"}
                    {saving}
                    error={activeSection === "tools" ? editError : ""}
                    onedit={() => openEditor("tools")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}<ConfigOptionCards
                            kind="tools"
                            values={draftOptions}
                            onchange={updateDraftOptions}
                            idPrefix="detail-tools"
                            {locale}
                        />{/snippet}
                </EditableSummaryRow>
                {#if standardOffer}
                    <EditableSummaryRow
                        icon={Laptop}
                        label={locale === "en" ? "Devices" : "Devices"}
                        value={locale === "en"
                            ? "Customer devices with admin rights"
                            : "Kundengeräte mit Administratorrechten"}
                        status={locale === "en" ? "Required" : "Vorausgesetzt"}
                    />
                {:else}
                    <EditableSummaryRow
                        icon={Laptop}
                        label={overviewRow("devices").label}
                        value={overviewRow("devices").value}
                        status={overviewRow("devices").status}
                        active={activeSection === "devices"}
                        {saving}
                        error={activeSection === "devices" ? editError : ""}
                        onedit={() => openEditor("devices")}
                        onsave={saveEditor}
                        oncancel={cancelEditor}
                    >
                        {#snippet editor()}<ConfigOptionCards
                                kind="devices"
                                values={draftOptions}
                                onchange={updateDraftOptions}
                                idPrefix="detail-devices"
                                {locale}
                            />{/snippet}
                    </EditableSummaryRow>
                {/if}
                <EditableSummaryRow
                    icon={Monitor}
                    label={overviewRow("equipment").label}
                    value={overviewRow("equipment").value}
                    status={overviewRow("equipment").status}
                    active={activeSection === "equipment"}
                    {saving}
                    error={activeSection === "equipment" ? editError : ""}
                    onedit={() => openEditor("equipment")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}<ConfigOptionCards
                            kind="equipment"
                            values={draftOptions}
                            onchange={updateDraftOptions}
                            idPrefix="detail-equipment"
                            {locale}
                        />{/snippet}
                </EditableSummaryRow>
                <EditableSummaryRow
                    icon={CalendarDays}
                    label={overviewRow("event-date").label}
                    value={overviewRow("event-date").value}
                    status={overviewRow("event-date").status}
                    active={activeSection === "event-time"}
                    saving={saving || eventSlotsLoading}
                    error={activeSection === "event-time" ? editError : ""}
                    onedit={() => openEditor("event-time")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}{#key eventAvailabilityKey}<EventDateTimeEditor
                                eventStart={draft.eventStart}
                                eventEnd={draft.eventEnd}
                                minValue={minEventDate}
                                maxValue={maxEventDate}
                                hackathonId={hackathon.id}
                                {locale}
                                onloadingchange={(value) => (eventSlotsLoading = value)}
                                onchange={(value) => (draft = { ...draft, ...value })}
                            />{/key}{/snippet}
                </EditableSummaryRow>
                <EditableSummaryRow
                    icon={Clock3}
                    label={overviewRow("prep-call").label}
                    value={overviewRow("prep-call").value}
                    status={overviewRow("prep-call").status}
                    active={activeSection === "prep-call"}
                    {saving}
                    error={activeSection === "prep-call" ? editError : ""}
                    onedit={() => openEditor("prep-call")}
                    onsave={saveEditor}
                    oncancel={cancelEditor}
                >
                    {#snippet editor()}<PrepCallEditor
                            value={draft.consultationSlot}
                            mode={prepCallMode}
                            customDate={customPrepCallDate}
                            {locale}
                            onchange={(consultationSlot) =>
                                (draft = { ...draft, consultationSlot })}
                            onmodechange={(value) => (prepCallMode = value)}
                            oncustomdatechange={(value) => (customPrepCallDate = value)}
                        />{/snippet}
                </EditableSummaryRow>
                {#if standardOffer}
                    <EditableSummaryRow
                        icon={Pizza}
                        label={locale === "en" ? "Lunch" : "Mittagessen"}
                        value={locale === "en"
                            ? "Pizza: Margherita, salami, and vegetarian options"
                            : "Pizza: Margherita, Salami und vegetarische Sorten"}
                        status={locale === "en" ? "Included" : "Inklusive"}
                    />
                {:else}
                    <EditableSummaryRow
                        icon={Pizza}
                        label={overviewRow("lunch").label}
                        value={overviewRow("lunch").value}
                        status={overviewRow("lunch").status}
                        active={activeSection === "lunch"}
                        {saving}
                        error={activeSection === "lunch" ? editError : ""}
                        onedit={() => openEditor("lunch")}
                        onsave={saveEditor}
                        oncancel={cancelEditor}
                    >
                        {#snippet editor()}<ConfigOptionCards
                                kind="lunch"
                                values={draftOptions}
                                onchange={updateDraftOptions}
                                idPrefix="detail-lunch"
                                {locale}
                            />{/snippet}
                    </EditableSummaryRow>
                {/if}
                <EditableSummaryRow
                    icon={Award}
                    label={overviewRow("winner-poster").label}
                    value={overviewRow("winner-poster").value}
                    status={overviewRow("winner-poster").status}
                />
                <EditableSummaryRow
                    icon={Camera}
                    label={overviewRow("event-photos").label}
                    value={overviewRow("event-photos").value}
                    status={overviewRow("event-photos").status}
                />
                <EditableSummaryRow
                    icon={Cookie}
                    label={overviewRow("snacks").label}
                    value={overviewRow("snacks").value}
                    status={overviewRow("snacks").status}
                />
                <EditableSummaryRow
                    icon={Plane}
                    label={overviewRow("travel").label}
                    value={overviewRow("travel").value}
                    status={overviewRow("travel").status}
                />
                <EditableSummaryRow
                    icon={ReceiptEuro}
                    label={overviewRow("total").label}
                    value={overviewRow("total").value}
                    status={overviewRow("total").status}
                    total
                />
            </div>
        </section>
    </div>
</div>
