import { KBService } from '../services/KBService.js'

async function main() {
  const result = await KBService.compose({ node_types: ['requirement'], domains: ['Marketing'], limit: 3 })
  console.log('KB compose smoke test:')
  console.log('Selected PRDs:', result.selectedCount)
  for (const prd of result.prds) {
    console.log(`- ${prd.id} (${prd.sections.length} sections)`) 
  }
  console.log('Fragments:', result.fragments.length)
}

main().catch((e) => {
  console.error('Smoke test failed:', e)
  process.exit(1)
})
