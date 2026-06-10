'use server'

import { execSync } from 'child_process'
import pkg from '../../../../../../package.json'

function getPackageVersion(name: string) {
  const dependencies = pkg.dependencies || {}
  const devDependencies = pkg.devDependencies || {}

  return (
    dependencies[name as keyof typeof dependencies] ||
    devDependencies[name as keyof typeof devDependencies] ||
    '-'
  )
}

function cleanVersion(version?: string) {
  if (!version) return '-'
  return version.replace(/^[\^~]/, '')
}

function getNpmVersion() {
  try {
    return execSync('npm -v', { encoding: 'utf8' }).trim()
  } catch {
    return '-'
  }
}

export async function getSystemStackInfo() {
  return {
    app: {
      name: pkg.name,
      version: pkg.version,
    },
    runtime: {
      node: process.version.replace(/^v/, ''),
      npm: getNpmVersion(),
    },
    packages: {
      next: cleanVersion(getPackageVersion('next')),
      react: cleanVersion(getPackageVersion('react')),
      reactDom: cleanVersion(getPackageVersion('react-dom')),
      prismaClient: cleanVersion(getPackageVersion('@prisma/client')),
      prismaCli: cleanVersion(getPackageVersion('prisma')),
      adapterPg: cleanVersion(getPackageVersion('@prisma/adapter-pg')),
      pg: cleanVersion(getPackageVersion('pg')),
      typescript: cleanVersion(getPackageVersion('typescript')),
    },
  }
}
