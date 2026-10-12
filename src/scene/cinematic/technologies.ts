// Experience descriptions come from PRODUCT.md; artwork provenance lives in public/logos/SOURCES.json.
export const technologies = {
  go: { name: 'Go', use: 'At SettleMint, I built distributed microservices in Go and Python for a national-scale regulated payments platform.' },
  kafka: { name: 'Apache Kafka', use: 'At SettleMint, I built API pipelines on Kafka and Redis.' },
  python: { name: 'Python', use: 'At Viasat, I built a Python AI agent with Google ADK to automate pre-warming of high-demand in-flight entertainment titles.' },
  redis: { name: 'Redis', use: 'Redis was part of the API pipelines I built at SettleMint.' },
  kubernetes: { name: 'Kubernetes', use: 'At CSULB Institutional Research, I containerized backend services with Docker and Kubernetes.' },
  docker: { name: 'Docker', use: 'At CSULB Institutional Research, I containerized Go and Python services with Docker and Kubernetes.' },
  prometheus: { name: 'Prometheus', use: 'At CSULB Institutional Research, I instrumented backend services with Prometheus and Grafana.' },
  grafana: { name: 'Grafana', use: 'At CSULB Institutional Research, I instrumented backend services with Prometheus and Grafana.' },
  cloudrun: { name: 'Cloud Run', use: 'At Viasat, I orchestrated the Python entertainment pre-warming agent on Google Cloud Run.' },
} as const;
export type TechnologyId = keyof typeof technologies;
export const districtTechnologies: Record<string, TechnologyId[]> = {
  career: ['go', 'kafka', 'python', 'redis'],
  research: ['kubernetes', 'docker', 'prometheus', 'grafana'],
  viasat: ['python', 'cloudrun'],
};
