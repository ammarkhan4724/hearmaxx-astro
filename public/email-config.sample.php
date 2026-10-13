<?php
/**
 * Hear Maxx - Email Configuration
 * 
 * Rename this file to `email-config.php` to customize email addresses or enable SMTP.
 * If this file does not exist, the form handler defaults to standard PHP mail()
 * and sends notifications to Info@hearmaxx.ca.
 */

return [
    // Recipient for clinic appointment requests & inquiries
    'owner_email' => 'Info@hearmaxx.ca',

    // Sender details for outgoing emails
    'from_email'  => 'noreply@hearmaxx.ca',
    'from_name'   => 'Hear Maxx',

    // Base URL for email assets (e.g., logo)
    'site_url'    => 'https://hearmaxx.ca',

    // SMTP Settings (Set 'use_smtp' => true to enable authenticated SMTP)
    'use_smtp'    => false,
    'smtp_host'   => 'smtp.hostinger.com', // e.g. smtp.hostinger.com or smtp.gmail.com
    'smtp_port'   => 465,                  // 465 for SSL, 587 for TLS
    'smtp_secure' => 'ssl',                  // 'ssl' or 'tls'
    'smtp_user'   => 'Info@hearmaxx.ca',
    'smtp_pass'   => 'YOUR_EMAIL_PASSWORD',
];
