/**
 * SEO Head Component - Manage meta tags for each page
 */

import React from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
}

export function SEOHead({ title, description, keywords, ogImage, ogUrl, canonicalUrl }: SEOHeadProps) {
  // Update document title
  React.useEffect(() => {
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      let element = document.querySelector(`meta[${property ? "property" : "name"}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(property ? "property" : "name", name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    updateMetaTag("description", description);
    if (keywords) updateMetaTag("keywords", keywords);
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    if (ogImage) updateMetaTag("og:image", ogImage, true);
    if (ogUrl) updateMetaTag("og:url", ogUrl, true);

    // Update canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector("link[rel='canonical']");
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", canonicalUrl);
    }

    return () => {
      // Cleanup if needed
    };
  }, [title, description, keywords, ogImage, ogUrl, canonicalUrl]);

  return null;
}
