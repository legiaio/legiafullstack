import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  console.log('Seeding services...');

  const services = [
    {
      title: 'Web Development',
      description: 'Full-stack web application development using modern technologies',
      category: 'Technology',
      price: 5000000, // 5M IDR
    },
    {
      title: 'Mobile App Development',
      description: 'Native and cross-platform mobile application development',
      category: 'Technology',
      price: 8000000, // 8M IDR
    },
    {
      title: 'UI/UX Design',
      description: 'User interface and user experience design for digital products',
      category: 'Design',
      price: 3000000, // 3M IDR
    },
    {
      title: 'Digital Marketing',
      description: 'Comprehensive digital marketing strategy and implementation',
      category: 'Marketing',
      price: 2500000, // 2.5M IDR
    },
    {
      title: 'Content Writing',
      description: 'Professional content creation for websites, blogs, and marketing materials',
      category: 'Content',
      price: 1500000, // 1.5M IDR
    },
    {
      title: 'SEO Optimization',
      description: 'Search engine optimization to improve website visibility',
      category: 'Marketing',
      price: 2000000, // 2M IDR
    },
    {
      title: 'Brand Identity Design',
      description: 'Complete brand identity design including logo, colors, and guidelines',
      category: 'Design',
      price: 4000000, // 4M IDR
    },
    {
      title: 'E-commerce Development',
      description: 'Online store development with payment integration',
      category: 'Technology',
      price: 7000000, // 7M IDR
    },
    {
      title: 'Social Media Management',
      description: 'Complete social media strategy and content management',
      category: 'Marketing',
      price: 1800000, // 1.8M IDR
    },
    {
      title: 'Video Production',
      description: 'Professional video production for marketing and promotional content',
      category: 'Media',
      price: 6000000, // 6M IDR
    }
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { title: service.title }
    });

    if (!existing) {
      await prisma.service.create({
        data: service,
      });
    }
  }

  console.log('Services seeded successfully!');
}

seedServices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });