<?php
/* =========================================================================
   KW New Projects — PHP backend (shared-hosting / Hostinger friendly)
   Stores blogs & leads in JSON files so admin-published blogs go live for
   every visitor. No database required.

   Endpoints (relative to this file, e.g. /api.php?action=blogs):
     GET  ?action=blogs        -> public: list published blog posts
     GET  ?action=session      -> is the current session an admin?
     POST ?action=login        -> { password }         (starts admin session)
     POST ?action=logout       -> end admin session
     POST ?action=lead         -> public: capture an enquiry lead
     GET  ?action=leads        -> admin: list leads
     POST ?action=delete_lead  -> admin: { id }
     POST ?action=save_blog    -> admin: create/update a post
     POST ?action=delete_blog  -> admin: { id }
   ========================================================================= */

declare(strict_types=1);

/* Never leak PHP errors/paths to the client (they still go to the server log). */
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');

/* Harden the session cookie (GoDaddy serves over HTTPS). SameSite=Lax blocks
   cross-site forged POSTs to the admin endpoints (CSRF mitigation). */
$__secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? '') === '443')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params([
        'lifetime' => 0, 'path' => '/', 'httponly' => true,
        'secure' => $__secure, 'samesite' => 'Lax',
    ]);
} else {
    session_set_cookie_params(0, '/; samesite=Lax', '', $__secure, true);
}
session_name('KWNPADMIN');
session_start();

$DATA_DIR   = __DIR__ . '/data';
$BLOGS_FILE = $DATA_DIR . '/blogs.json';
$LEADS_FILE = $DATA_DIR . '/leads.json';

/* SHA-256 hash of the admin password (same hash used by admin.html fallback).
   To change the password, replace this with the SHA-256 hex of the new one. */
$ADMIN_SHA256 = '82e39aa4c1f657b4b378ed1b2067cf9fe22795d88eb660dcebad143157e7c231';

if (!is_dir($DATA_DIR)) { @mkdir($DATA_DIR, 0755, true); }

/* ---------- helpers ---------- */
function jexit($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
function read_json(string $file): array {
    if (!is_file($file)) return [];
    $raw = @file_get_contents($file);
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
function write_json(string $file, array $data): bool {
    $json = json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return @file_put_contents($file, $json, LOCK_EX) !== false;
}
function input(): array {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw !== false ? $raw : '', true);
    if (is_array($json)) return $json;
    return $_POST;
}
function clean_str($val, int $max = 500): string {
    $s = is_string($val) ? $val : '';
    $s = str_replace("\0", '', trim($s));
    if (mb_strlen($s) > $max) $s = mb_substr($s, 0, $max);
    return $s;
}
function is_admin(): bool { return !empty($_SESSION['kwnp_admin']); }
function slugify(string $s): string {
    $s = strtolower(trim($s));
    $s = preg_replace('/[^a-z0-9\s-]/', '', $s) ?? '';
    $s = preg_replace('/[\s-]+/', '-', $s) ?? '';
    return trim($s, '-');
}
function safe_image(string $url): string {
    $url = trim($url);
    if ($url === '') return '';
    if (preg_match('#^https?://#i', $url)) return $url;
    if (preg_match('#^images/[A-Za-z0-9._/\-]+$#', $url)) return $url;
    return '';
}
function new_id(string $prefix): string {
    return $prefix . bin2hex(random_bytes(6));
}

/* ---------- seed sample blog posts on first run ---------- */
if (!is_file($BLOGS_FILE)) {
    $now = date('c');
    write_json($BLOGS_FILE, [
        [
            'id' => new_id('bl_'),
            'title' => 'KW New Projects Location: Why Ghaziabad Is the Smart Choice',
            'slug' => 'kw-new-projects-location-ghaziabad',
            'category' => 'Location',
            'meta' => 'Explore the KW New Projects Location advantage — metro, expressway and social-infra connectivity to Delhi & Noida.',
            'image' => 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
            'body' => "KW New Projects enjoys a prime Ghaziabad address that balances connectivity with calm.\n\nWith quick access to the metro network and major expressways, commuting to Delhi and Noida is effortless. Reputed schools, hospitals, malls and workspaces lie within a short drive, making everyday life convenient for families.\n\nFor home-buyers evaluating the KW New Projects Location, the combination of low-density planning and strong civic infrastructure makes it a compelling long-term investment.",
            'date' => $now,
        ],
        [
            'id' => new_id('bl_'),
            'title' => 'KW New Projects Amenities: Resort-Grade Living Explained',
            'slug' => 'kw-new-projects-amenities-guide',
            'category' => 'Amenities',
            'meta' => 'A complete guide to KW New Projects Amenities — clubhouse, infinity pool, gym, sky deck and smart-home features.',
            'image' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
            'body' => "Luxury is in the details, and KW New Projects Amenities are designed to elevate everyday living.\n\nResidents enjoy a grand clubhouse, infinity-edge pool, fully-equipped gymnasium, spa, landscaped greens and a sky deck lounge with panoramic views.\n\nFamilies benefit from dedicated kids play zones, sports courts and jogging tracks, while smart-home automation and 24x7 security deliver peace of mind across both towers.",
            'date' => $now,
        ],
        [
            'id' => new_id('bl_'),
            'title' => 'KW New Projects RERA & Construction Status: What Buyers Should Know',
            'slug' => 'kw-new-projects-rera-construction-status',
            'category' => 'Updates',
            'meta' => 'Understand KW New Projects RERA Status, Construction Status and Possession Date — and how to verify them on up-rera.in.',
            'image' => 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1000&q=80',
            'body' => "Transparency matters when buying a pre-launch home. The KW New Projects RERA Number and RERA Status are currently To be updated and should always be verified on the official portal at up-rera.in.\n\nAs the project progresses, Construction Status and Project Status updates will be shared on the official website.\n\nWe recommend every buyer confirm regulated details — prices, sizes, RERA registration and possession date — independently before booking.",
            'date' => $now,
        ],
    ]);
}

/* ---------- router ---------- */
$action = $_GET['action'] ?? (input()['action'] ?? '');

switch ($action) {

    case 'blogs': {
        $blogs = read_json($BLOGS_FILE);
        usort($blogs, fn($a, $b) => strcmp((string)($b['date'] ?? ''), (string)($a['date'] ?? '')));
        jexit(['ok' => true, 'blogs' => array_values($blogs)]);
    }

    case 'session':
        jexit(['ok' => true, 'admin' => is_admin()]);

    case 'login': {
        $pw = clean_str(input()['password'] ?? '', 200);
        // constant-time compare to avoid timing attacks
        if ($pw !== '' && hash_equals($ADMIN_SHA256, hash('sha256', $pw))) {
            session_regenerate_id(true);
            $_SESSION['kwnp_admin'] = true;
            jexit(['ok' => true]);
        }
        usleep(400000); // slow down brute force
        jexit(['ok' => false, 'error' => 'Incorrect password'], 401);
    }

    case 'health':
        jexit([
            'ok' => true,
            'php' => PHP_VERSION,
            'data_writable' => is_dir($DATA_DIR) && is_writable($DATA_DIR),
            'admin' => is_admin(),
        ]);

    case 'logout':
        $_SESSION = [];
        session_destroy();
        jexit(['ok' => true]);

    case 'lead': {
        $b = input();
        $name  = clean_str($b['name'] ?? '', 120);
        $phone = clean_str($b['phone'] ?? '', 30);
        if ($name === '' || $phone === '') {
            jexit(['ok' => false, 'error' => 'Name and phone are required'], 422);
        }
        $lead = [
            'id'        => new_id('ld_'),
            'name'      => $name,
            'phone'     => $phone,
            'email'     => clean_str($b['email'] ?? '', 160),
            'config'    => clean_str($b['config'] ?? '', 60) ?: '—',
            'visitDate' => clean_str($b['visitDate'] ?? '', 40) ?: '—',
            'source'    => clean_str($b['source'] ?? 'Website', 60),
            'date'      => date('c'),
        ];
        $leads = read_json($LEADS_FILE);
        $leads[] = $lead;
        write_json($LEADS_FILE, $leads);
        jexit(['ok' => true]);
    }

    case 'leads': {
        if (!is_admin()) jexit(['ok' => false, 'error' => 'Not authorized'], 401);
        $leads = read_json($LEADS_FILE);
        usort($leads, fn($a, $b) => strcmp((string)($b['date'] ?? ''), (string)($a['date'] ?? '')));
        jexit(['ok' => true, 'leads' => array_values($leads)]);
    }

    case 'delete_lead': {
        if (!is_admin()) jexit(['ok' => false, 'error' => 'Not authorized'], 401);
        $id = clean_str(input()['id'] ?? '', 60);
        $leads = array_values(array_filter(read_json($LEADS_FILE), fn($l) => ($l['id'] ?? '') !== $id));
        write_json($LEADS_FILE, $leads);
        jexit(['ok' => true]);
    }

    case 'clear_leads': {
        if (!is_admin()) jexit(['ok' => false, 'error' => 'Not authorized'], 401);
        write_json($LEADS_FILE, []);
        jexit(['ok' => true]);
    }

    case 'save_blog': {
        if (!is_admin()) jexit(['ok' => false, 'error' => 'Not authorized'], 401);
        $b = input();
        $title = clean_str($b['title'] ?? '', 180);
        $body  = clean_str($b['body'] ?? '', 20000);
        if ($title === '' || $body === '') {
            jexit(['ok' => false, 'error' => 'Title and body are required'], 422);
        }
        $id = clean_str($b['id'] ?? '', 60);
        $post = [
            'id'       => $id !== '' ? $id : new_id('bl_'),
            'title'    => $title,
            'category' => clean_str($b['category'] ?? 'Updates', 40) ?: 'Updates',
            'meta'     => clean_str($b['meta'] ?? '', 200),
            'image'    => safe_image((string)($b['image'] ?? '')),
            'slug'     => slugify((string)($b['slug'] ?? $title)) ?: slugify($title),
            'body'     => $body,
            'date'     => date('c'),
        ];
        $blogs = read_json($BLOGS_FILE);
        $found = false;
        foreach ($blogs as $i => $existing) {
            if (($existing['id'] ?? '') === $post['id']) {
                $post['date'] = $existing['date'] ?? $post['date']; // preserve original publish date
                $blogs[$i] = $post;
                $found = true;
                break;
            }
        }
        if (!$found) $blogs[] = $post;
        write_json($BLOGS_FILE, $blogs);
        jexit(['ok' => true, 'post' => $post]);
    }

    case 'delete_blog': {
        if (!is_admin()) jexit(['ok' => false, 'error' => 'Not authorized'], 401);
        $id = clean_str(input()['id'] ?? '', 60);
        $blogs = array_values(array_filter(read_json($BLOGS_FILE), fn($p) => ($p['id'] ?? '') !== $id));
        write_json($BLOGS_FILE, $blogs);
        jexit(['ok' => true]);
    }

    default:
        jexit(['ok' => false, 'error' => 'Unknown action'], 400);
}
