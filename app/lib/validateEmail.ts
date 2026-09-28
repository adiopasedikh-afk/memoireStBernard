// Liste des domaines temporaires/jetables connus à bloquer
const DISPOSABLE_DOMAINS = new Set([
    'yopmail.com', 'yopmail.fr', 'tempmail.com', 'guerrillamail.com',
    'sharklasers.com', 'dispostable.com', 'getnada.com', '10minutemail.com',
    'trashmail.com', 'mailinator.com', 'maildrop.cc'
]);

// Correction des fautes de frappe courantes sur les domaines
const TYPO_DOMAINS: Record<string, string> = {
    'gmai.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmai.fr': 'hotmail.fr',
    'yaho.fr': 'yahoo.fr',
    'outlok.com': 'outlook.com',
};

export type EmailValidationResult = {
    isValid: boolean;
    error?: string;
    suggestion?: string;
};

export function validateEmail(email: string): EmailValidationResult {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Verification de la syntaxe RFC basique
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
        return { isValid: false, error: 'Format d\'adresse e-mail invalide.' };
    }

    const [username, domain] = cleanEmail.split('@');

    if (!username || !domain) {
        return { isValid: false, error: 'Adresse e-mail incomplète.' };
    }

    // 2. Vérification des fautes de frappe courantes (Typo check)
    if (TYPO_DOMAINS[domain]) {
        const suggestedEmail = `${username}@${TYPO_DOMAINS[domain]}`;
        return {
            isValid: false,
            error: `Erreur de frappe détectée. Vouliez-vous dire ${suggestedEmail} ?`
        };
    }

    // 3. Blocage des e-mails jetables/temporaires
    if (DISPOSABLE_DOMAINS.has(domain)) {
        return {
            isValid: false,
            error: 'Les adresses e-mails temporaires ou jetables ne sont pas autorisées.'
        };
    }

    return { isValid: true };
}