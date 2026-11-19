import { siteConfig } from '@/src/constants/site';

import {
  LocalBusinessSchemaInput,
  OrganizationSchemaInput,
  WebSiteSchemaInput,
} from './seo-schema';

export const siteUrl = siteConfig.siteUrl;

export const organizationConfig: OrganizationSchemaInput = {
  name: siteConfig.name,
  legalName: siteConfig.name,
  url: siteUrl,
  logoUrl: `${siteUrl}/web-app-manifest-512x512.png`,
  sameAs: {
    instagram: siteConfig.links.instagram,
  },
};

export const localBusinessConfig: LocalBusinessSchemaInput = {
  name: siteConfig.name,
  url: siteUrl,
  logoUrl: `${siteUrl}/web-app-manifest-512x512.png`,
  telephone: siteConfig.formatedPhone,
  priceRange: '$$',
  streetAddress: siteConfig.address,
  addressLocality: siteConfig.province,
  addressRegion: 'Tucumán',
  postalCode: '4000',
  addressCountry: 'AR',
  openingHours: ['Mo-Fr 09:00-18:00'],
};

export const webSiteConfig: WebSiteSchemaInput = {
  name: siteConfig.name,
  url: siteUrl,
};
