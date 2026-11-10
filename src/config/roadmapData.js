/**
 * Cyber Security roadmap, transcribed from https://roadmap.sh/cyber-security
 * (topic names are roadmap.sh's; grouping follows the labels on their chart).
 *
 * Each group is [title, "item|item|item"]. Item ids are derived from
 * phase key + group title + item label, so keep those stable.
 */

export const ROADMAP_SOURCE_URL = "https://roadmap.sh/cyber-security";

const RAW = [
  {
    key: "it",
    title: "Fundamental IT Skills",
    groups: [
      ["Core", "Computer Hardware Components|Connection Types and their function|OS-Independent Troubleshooting|Understand Basics of Popular Suites|Basics of Computer Networking"],
      ["Connection types", "NFC|WiFi|Bluetooth|Infrared"],
      ["Popular suites", "MS Office Suite|Google Suite|iCloud"]
    ]
  },
  {
    key: "os",
    title: "Operating Systems",
    groups: [
      ["Systems", "Windows|Linux|MacOS"],
      ["Learn for each", "Installation and Configuration|Different Versions and Differences|Navigating using GUI and CLI|Understand Permissions|Installing Software and Applications|Performing CRUD on Files|Troubleshooting|Common Commands"]
    ]
  },
  {
    key: "net",
    title: "Networking Knowledge",
    groups: [
      ["Core", "Understand the OSI Model|Common Protocols and their Uses|Common Ports and their Uses|SSL and TLS Basics|Basics of NAS and SAN|Basics of Subnetting|Public vs Private IP Addresses"],
      ["IP terminology", "localhost|loopback|CIDR|subnet mask|default gateway"],
      ["Understand the terminology", "VLAN|DMZ|ARP|VM|DHCP|DNS|NAT|IP|Router|Switch|VPN"],
      ["Understand these", "MAN|LAN|WAN|WLAN"],
      ["Functions of each", "DHCP|DNS|NTP|IPAM"],
      ["Network topologies", "Star|Ring|Mesh|Bus"],
      ["Network protocols", "SSH|RDP|FTP|SFTP|HTTP / HTTPS|SSL / TLS"],
      ["Common virtualization technologies", "VMWare|VirtualBox|esxi|proxmox"],
      ["Basics of virtualization", "Hypervisor|GuestOS|HostOS|VM"],
      ["Troubleshooting tools", "ipconfig|ping|dig|netstat|route|nmap|tcpdump|arp|tracert|nslookup|iptables|Packet Sniffers|Port Scanners|Protocol Analyzers"],
      ["Authentication methodologies", "Kerberos|RADIUS|LDAP|SSO|Certificates|Local Auth"]
    ]
  },
  {
    key: "sec",
    title: "Security Skills and Knowledge",
    groups: [
      ["Security operations basics", "Understand Common Hacking Tools|Understand Common Exploit Frameworks|Understand Concept of Defense in Depth|Understand Concept of Runbooks|Understand Basics of Forensics|Basics and Concepts of Threat Hunting|Basics of Vulnerability Management|Basics of Reverse Engineering|Penetration Testing Rules of Engagement|Perimiter vs DMZ vs Segmentation"],
      ["Defense principles", "Core Concepts of Zero Trust|Roles of Compliance and Auditors|Understand the Definition of Risk|Understand Backups and Resiliency|Cyber Kill Chain|MFA & 2FA|Honeypots|Operating System Hardening|Understand Concept of Isolation|Basics of IDS and IPS|Authentication vs Authorization"],
      ["Threat fundamentals", "Blue / Red / Purple Teams|False Negative / False Positive|True Negative / True Positive|Basics of Threat Intel, OSINT|Understand Handshakes|Understand CIA Triad|Privilege Escalation|Web Based Attacks and OWASP10|Learn how Malware works and Types"],
      ["Basics of cryptography", "Salting|Hashing|Key Exchange|Private vs Public Keys|PKI|Obfuscation"],
      ["Attack types and differences", "Phishing|Whishing|Whaling|Smishing|Spam vs Spim|Shoulder Surfing|Tailgating|Dumpster Diving|Zero day|Social Engineering|Reconnaissance|Impersonation|Watering Hole Attack|Drive by Attack|Typo Squatting|Brute Force vs Password Spray"],
      ["Common attacks", "DoS vs DDoS|MITM|CSRF|Spoofing|SQL Injection|XSS|Evil Twin|VLAN Hopping|DNS Poisoning|Deauth Attack|Replay Attack|Rogue Access Point|Buffer Overflow|Memory Leak|Pass the Hash|Directory Traversal"],
      ["Tools for incident response and discovery", "dig|nmap|ping|arp|cat|dd|tail|head|grep|hping|nslookup|tracert|ipconfig|curl|winhex|autopsy|wireshark|memdump|FTK Imager"],
      ["Understand frameworks", "ATT&CK|Kill Chain|Diamond Model"],
      ["Understand common standards", "ISO|NIST|RMF|CIS|CSF"],
      ["Common distros for hacking", "Kali Linux|ParrotOS"],
      ["Understand the following", "SIEM|SOAR"],
      ["Using tools for unintended purposes", "LOLBAS|GTFOBINS|WADCOMS"],
      ["Secure vs unsecure protocols", "FTP vs SFTP|SSL vs TLS|IPSEC|DNSSEC|LDAPS|SRTP|S/MIME"],
      ["Find and use these logs", "Event Logs|syslogs|netflow|Packet Captures|Firewall Logs"],
      ["Understand the following terms", "Antivirus|Antimalware|EDR|DLP|Firewall & Nextgen Firewall|HIPS|NIDS|NIPS|Host Based Firewall|Sandboxing|EAP vs PEAP|WPS|ACL|WPA vs WPA2 vs WPA3 vs WEP"],
      ["Understand hardening concepts", "MAC-based|NAC-based|Port Blocking|Group Policy|Sinkholes|ACLs|Patching|Jump Server|Endpoint Security"],
      ["Understand common tools", "VirusTotal|urlscan|any.run|Joe Sandbox|urlvoid|WHOIS"],
      ["Incident response process", "Preparation|Identification|Containment|Eradication|Recovery|Lessons Learned"],
      ["Understand audience", "Stakeholders|HR|Legal|Compliance|Management"],
      ["Understand threat classification", "Zero Day|Known vs Unknown|APT"]
    ]
  },
  {
    key: "cloud",
    title: "Cloud Skills and Knowledge",
    groups: [
      ["Core", "Understand the Concept of Security in the Cloud|Understand the differences between cloud and on-premises|Understand the concept of Infrastructure as Code|Understand the Concept of Serverless|Understand the basics and general flow of deploying in the cloud"],
      ["Cloud services", "SaaS|PaaS|IaaS"],
      ["Cloud models", "Private|Public|Hybrid"],
      ["Common cloud environments", "AWS|GCP|Azure"],
      ["Common cloud storage", "S3|Dropbox|Box|OneDrive|Google Drive|iCloud"]
    ]
  },
  {
    key: "prog",
    title: "Programming Skills",
    groups: [["Languages", "Python|Go|JavaScript|C++|Bash|Power Shell"]]
  },
  {
    key: "extra",
    title: "Practice and Certifications",
    optional: true,
    groups: [
      ["CTFs (Capture the Flag)", "HackTheBox|TryHackMe|VulnHub|picoCTF|pwn.college"],
      ["Beginner certifications", "CompTIA A+|CompTIA Linux+|CompTIA Network+|CCNA|CompTIA Security+"],
      ["Advanced certifications", "CEH|CISA|CISM|GSEC|GPEN|GWAPT|GIAC|OSCP|CREST|CISSP"]
    ]
  }
];

function slug(s) {
  return s.toLowerCase().replace(/&/g, "and").replace(/\+/g, "p").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const ROADMAP = RAW.map((phase, idx) => ({
  key: phase.key,
  number: idx + 1,
  title: phase.title,
  optional: !!phase.optional,
  groups: phase.groups.map(([title, items]) => ({
    title,
    items: items.split("|").map((label) => ({
      id: `${phase.key}.${slug(title)}.${slug(label)}`,
      label
    }))
  }))
}));

export const ROADMAP_ITEMS = ROADMAP.flatMap((p) =>
  p.groups.flatMap((g) => g.items.map((i) => ({ ...i, phase: p.title, phaseKey: p.key, group: g.title, optional: p.optional })))
);

/** Progress summary for a { [itemId]: true } map. Optional phase is excluded from the headline %. */
export function roadmapStats(progress = {}) {
  const core = ROADMAP_ITEMS.filter((i) => !i.optional);
  const done = core.filter((i) => progress[i.id]).length;
  const next = core.find((i) => !progress[i.id]) || null;
  return {
    total: core.length,
    done,
    percent: core.length ? Math.round((done / core.length) * 100) : 0,
    next
  };
}

export function phaseStats(phase, progress = {}) {
  const items = phase.groups.flatMap((g) => g.items);
  const done = items.filter((i) => progress[i.id]).length;
  return { total: items.length, done, percent: items.length ? Math.round((done / items.length) * 100) : 0 };
}
