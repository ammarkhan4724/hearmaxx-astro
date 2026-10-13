export interface Clinic {
  id: 'mississauga' | 'york';
  name: string;
  plaza?: string;
  street: string;
  city: string;
  province: string;
  postalCode: string; // [TODO: Confirm Mississauga postal code with owner]
  formattedAddress: string;
  phone: string;
  phoneRaw: string;
  email: string;
  hours: {
    days: string;
    time: string;
  }[];
  googleMapsDirectionsUrl: string;
  googleMapsEmbedUrl: string;
}

export interface BrandPartner {
  name: string;
  slug: string;
  website: string;
  logo: string;
}

export interface NavItem {
  label: string;
  href?: string;
  children?: {
    category: string;
    items: {
      label: string;
      href: string;
      description?: string;
    }[];
  }[];
}

export const siteConfig = {
  name: 'Hear Maxx',
  tagline: 'Your hearing, Our priority.',
  url: (typeof process !== 'undefined' && process.env?.PUBLIC_SITE_URL) ? process.env.PUBLIC_SITE_URL : 'https://hearmaxx.ca',
  description: 'Hear Maxx offers certified audiologist consultations, comprehensive hearing evaluations, advanced digital hearing aids, and complete ear care solutions in Mississauga and York, Ontario.',
  reviewScore: '4.93',
  reviewCount: '105+',
  ratingLine: 'Rated 4.93 based on 105+ reviews on Google',
  experienceYears: '25+',
  trustBadge: 'Trusted by thousands, delivering excellence for over 25 years.',
  generalEmail: 'Info@hearmaxx.ca',

  // Founder profile (Credentials standardized per prompt with TODO)
  specialist: {
    name: 'Sheeraz Rahim',
    title: 'Hearing Care Specialist', // [TODO: Owner to confirm exact Ontario licensing designation]
    experience: 'Over 20 years of clinical experience',
    bio: 'Founder and lead specialist at Hear Maxx, dedicated to patient-centered hearing health, comprehensive diagnostic testing, and customized hearing aid fittings.',
  },

  socials: {
    facebook: 'https://www.facebook.com/centre4hearing',
    instagram: 'https://www.instagram.com/hearmaxxofficial',
    email: 'mailto:Info@hearmaxx.ca',
  },

  clinics: {
    mississauga: {
      id: 'mississauga',
      name: 'Hear Maxx - Mississauga Clinic',
      street: '1151 Dundas Street West #17',
      city: 'Mississauga',
      province: 'ON',
      postalCode: 'L5C 1C6', // [TODO: Owner please confirm exact suite postal code for 1151 Dundas St W #17]
      formattedAddress: '1151 Dundas Street West #17, Mississauga, ON',
      phone: '+1 905-232-7860',
      phoneRaw: '+19052327860',
      email: 'Info@hearmaxx.ca',
      hours: [
        { days: 'Monday – Friday', time: '10:00 – 17:00' },
        { days: 'Saturday', time: '13:00 – 16:00' },
        { days: 'Sunday', time: 'Closed' },
      ],
      googleMapsDirectionsUrl: 'https://maps.google.com/?q=1151+Dundas+Street+West+%2317,+Mississauga,+ON',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2892.428420366627!2d-79.664426!3d43.555848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b43b679586111%3A0xc3b7a5e8c1fa8626!2s1151%20Dundas%20St%20W%2C%20Mississauga%2C%20ON!5e0!3m2!1sen!2sca!4v1700000000000!5m2!1sen!2sca',
    } as Clinic,

    york: {
      id: 'york',
      name: 'Hear Maxx - York Clinic',
      plaza: 'Jane Park Plaza',
      street: '861 A Jane Street',
      city: 'York',
      province: 'ON',
      postalCode: 'M6N 4C4',
      formattedAddress: 'Jane Park Plaza, 861 A Jane Street, York, ON M6N 4C4',
      phone: '+1 416-792-8792',
      phoneRaw: '+14167928792',
      email: 'Info@hearmaxx.ca',
      hours: [
        { days: 'Monday – Friday', time: '09:00 – 17:00' },
        { days: 'Saturday', time: '09:00 – 12:00' },
        { days: 'Sunday', time: 'Closed' },
      ],
      // Corrected York directions (Fixing legacy error that pointed to Lahore coordinates 31.44, 74.23)
      googleMapsDirectionsUrl: 'https://maps.google.com/?q=861+A+Jane+Street,+York,+ON+M6N+4C4',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2884.9789394605963!2d-79.497576!3d43.684126!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b34208a0d24c7%3A0xe541785501ba1ee4!2s861%20Jane%20St%2C%20York%2C%20ON%20M6N%204C4!5e0!3m2!1sen!2sca!4v1700000000000!5m2!1sen!2sca',
    } as Clinic,
  },

  brandPartners: [
    { name: 'Bernafon', slug: 'bernafon', website: 'https://www.bernafon.com', logo: '/src/assets/brands/bernafon.png' },
    { name: 'Signia', slug: 'signia', website: 'https://www.signia.net', logo: '/src/assets/brands/signia.png' },
    { name: 'Oticon', slug: 'oticon', website: 'https://www.oticon.ca', logo: '/src/assets/brands/oticon.png' },
    { name: 'Widex', slug: 'widex', website: 'https://www.widex.com', logo: '/src/assets/brands/widex.png' },
    { name: 'Starkey', slug: 'starkey', website: 'https://www.starkey.com', logo: '/src/assets/brands/starkey.png' },
    { name: 'Phonak', slug: 'phonak', website: 'https://www.phonak.com', logo: '/src/assets/brands/phonak.png' },
  ] as BrandPartner[],

  navigation: [
    {
      label: 'Hearing Health',
      children: [
        {
          category: 'Understanding Hearing Loss',
          items: [
            {
              label: 'The Impact of Untreated Hearing Loss',
              href: '/the-impact-of-untreated-hearing-loss/',
              description: 'Understand cognitive, social, and physical risks of delaying care.',
            },
            {
              label: 'Signs You May Have Hearing Loss',
              href: '/signs-you-may-have-hearing-loss/',
              description: 'Key symptoms and daily indicators that warrant an evaluation.',
            },
          ],
        },
        {
          category: 'Tinnitus & Ear Health',
          items: [
            {
              label: 'What is Tinnitus & Its Treatment?',
              href: '/what-is-tinnitus/',
              description: 'Recognize ringing in the ears, common triggers, and therapy options.',
            },
            {
              label: 'Ear Infections & Conditions',
              href: '/ear-infections-conditions/',
              description: 'Outer, middle, and inner ear ailments, symptoms, and care.',
            },
          ],
        },
      ],
    },
    { label: 'Hearing Solutions', href: '/explore-hearing-solutions/' },
    { label: 'Our Services', href: '/our-services/' },
    { label: 'About Us', href: '/about-us/' },
    { label: 'Contact Us', href: '/contact-us/' },
  ] as NavItem[],
};
