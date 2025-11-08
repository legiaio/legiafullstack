const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Checking database...')
  
  // Check all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
      createdAt: true
    }
  })
  
  console.log('Existing users:', users.length)
  users.forEach(user => {
    console.log(`- ${user.email} (${user.name}) - Role: ${user.role} - Has password: ${!!user.password}`)
  })
  
  // Create test user if doesn't exist
  const testEmail = 'john.doe@example.com'
  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail }
  })
  
  if (!existingUser) {
    console.log('\nCreating test user...')
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const newUser = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: testEmail,
        password: hashedPassword,
        role: 'CLIENT'
      }
    })
    
    console.log('Created user:', newUser.email)
  } else {
    console.log('\nTest user already exists')
    
    // Test password verification
    if (existingUser.password) {
      const isValid = await bcrypt.compare('password123', existingUser.password)
      console.log('Password verification test:', isValid ? 'PASS' : 'FAIL')
    } else {
      console.log('User has no password set')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())