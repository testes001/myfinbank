from urllib.parse import urlparse

# Broad, high-trust domains for general software development
# Categorized for clarity
ALLOWED_DOMAINS = {
    # Official documentation
    "developer.mozilla.org",
    "w3.org",
    "whatwg.org",
    "python.org",
    "docs.python.org",
    "php.net",
    "ruby-lang.org",
    "golang.org",
    "rust-lang.org",
    "nodejs.org",
    "nextjs.org",
    "react.dev",
    "vuejs.org",
    "angular.io",
    "vercel.com",
    "firebase.google.com",
    "aws.amazon.com",
    "cloud.google.com",
    "docs.microsoft.com",
    "kubernetes.io",
    "docker.com",
    "terraform.io",
    "ansible.com",
    "chef.io",
    
    # Package managers
    "pypi.org",
    "npmjs.com",
    "rubygems.org",
    "packagist.org",
    "crates.io",
    
    # Security & standards
    "owasp.org",
    "nvd.nist.gov",
    "cve.mitre.org",
    
    # Popular open-source repos
    "github.com",
    "gitlab.com",
}

def validate(results):
    """
    Validate a list of search results, allowing only high-trust domains.

    Args:
        results (list[dict]): List of search results, each with 'url' field

    Returns:
        list[dict]: Filtered, validated results
    """
    validated = []
    for r in results:
        url = r.get("url", "")
        domain = urlparse(url).netloc
        # Remove www prefix for comparison
        domain = domain.replace("www.", "")
        if any(allowed in domain for allowed in ALLOWED_DOMAINS):
            validated.append(r)
    return validated
