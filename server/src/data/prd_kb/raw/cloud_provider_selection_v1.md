# Cloud Provider Selection (v1 Raw)

## Overview
Decision framework for AWS vs Firebase vs others.

## Decision Criteria
Latency, scale, data residency, compliance, time-to-market, lock-in, cost.

## AWS Profile
ECS/EKS, RDS/Aurora, API Gateway + Lambda, IAM.

## Firebase Profile
Auth, Firestore, Functions, Hosting; lock-in considerations.

## Hybrid & Migration
Start on Firebase; migrate hot paths to AWS; data export; auth federation.
