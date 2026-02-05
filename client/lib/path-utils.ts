/**
 * Utilitaires pour la gestion des chemins sur le plateau
 */

export interface TileNode {
    id: string
    x: number
    y: number
    type: string
    connections: string[] // IDs des cases adjacentes connectées
}

export interface PathStep {
    tileId: string
    x: number
    y: number
    stepNumber: number
}

export interface PathOption {
    path: PathStep[]
    finalTile: TileNode
    requiresChoice: boolean
    choiceAtStep: number // À quelle étape le choix a été fait
}

/**
 * Construit un graphe de connexions à partir des cases
 */
export function buildTileGraph(tiles: TileNode[]): Map<string, TileNode> {
    const graph = new Map<string, TileNode>()

    tiles.forEach((tile) => {
        // Auto-générer les connexions si non définies (basé sur la proximité)
        if (!tile.connections || tile.connections.length === 0) {
            const adjacentTiles = tiles.filter(
                (t) => t.id !== tile.id && Math.abs(t.x - tile.x) + Math.abs(t.y - tile.y) === 1
            )
            tile.connections = adjacentTiles.map((t) => t.id)
        }
        graph.set(tile.id, tile)
    })

    return graph
}

/**
 * Trouve les cases adjacentes (connexions sortantes)
 */
export function getConnectedTiles(tileId: string, graph: Map<string, TileNode>, excludeId?: string): TileNode[] {
    const tile = graph.get(tileId)
    if (!tile) return []

    return tile.connections
        .filter((id) => id !== excludeId)
        .map((id) => graph.get(id))
        .filter((t): t is TileNode => t !== undefined)
}

/**
 * Calcule tous les chemins possibles pour un nombre de pas donné
 */
export function calculatePossiblePaths(
    startTileId: string,
    steps: number,
    graph: Map<string, TileNode>,
    previousTileId?: string
): PathOption[] {
    const startTile = graph.get(startTileId)
    if (!startTile) return []

    const results: PathOption[] = []

    function explore(
        currentId: string,
        remainingSteps: number,
        path: PathStep[],
        previousId: string | undefined,
        choiceMade: boolean,
        choiceStep: number
    ) {
        const current = graph.get(currentId)
        if (!current) return

        // Ajouter la case actuelle au chemin
        const currentStep: PathStep = {
            tileId: currentId,
            x: current.x,
            y: current.y,
            stepNumber: steps - remainingSteps,
        }
        const newPath = [...path, currentStep]

        // Si on a fait tous les pas, c'est une destination finale
        if (remainingSteps === 0) {
            results.push({
                path: newPath,
                finalTile: current,
                requiresChoice: choiceMade,
                choiceAtStep: choiceStep,
            })
            return
        }

        // Trouver les cases suivantes possibles (exclure d'où on vient pour éviter les allers-retours)
        const nextTiles = getConnectedTiles(currentId, graph, previousId)

        // Si aucune case suivante, on reste sur place
        if (nextTiles.length === 0) {
            results.push({
                path: newPath,
                finalTile: current,
                requiresChoice: choiceMade,
                choiceAtStep: choiceStep,
            })
            return
        }

        // Si plusieurs directions possibles, marquer qu'un choix est nécessaire
        const needsChoice = nextTiles.length > 1

        // Explorer chaque direction
        nextTiles.forEach((nextTile) => {
            explore(
                nextTile.id,
                remainingSteps - 1,
                newPath,
                currentId,
                choiceMade || needsChoice,
                needsChoice && !choiceMade ? steps - remainingSteps : choiceStep
            )
        })
    }

    // Commencer l'exploration
    const connectedFromStart = getConnectedTiles(startTileId, graph, previousTileId)

    if (connectedFromStart.length === 0) {
        // Pas de connexion, rester sur place
        return [
            {
                path: [{ tileId: startTileId, x: startTile.x, y: startTile.y, stepNumber: 0 }],
                finalTile: startTile,
                requiresChoice: false,
                choiceAtStep: -1,
            },
        ]
    }

    connectedFromStart.forEach((nextTile) => {
        explore(
            nextTile.id,
            steps - 1,
            [{ tileId: startTileId, x: startTile.x, y: startTile.y, stepNumber: 0 }],
            startTileId,
            connectedFromStart.length > 1,
            connectedFromStart.length > 1 ? 0 : -1
        )
    })

    return results
}

/**
 * Regroupe les chemins par destination unique
 */
export function groupPathsByDestination(paths: PathOption[]): Map<string, PathOption[]> {
    const grouped = new Map<string, PathOption[]>()

    paths.forEach((path) => {
        const destId = path.finalTile.id
        const existing = grouped.get(destId) || []
        existing.push(path)
        grouped.set(destId, existing)
    })

    return grouped
}

/**
 * Détermine si un choix de chemin est nécessaire
 */
export function needsPathChoice(paths: PathOption[]): boolean {
    if (paths.length <= 1) return false

    // Vérifier si les destinations sont différentes
    const destinations = new Set(paths.map((p) => p.finalTile.id))
    return destinations.size > 1
}

/**
 * Génère les connexions automatiques pour un plateau linéaire
 */
export function generateLinearConnections(tiles: TileNode[]): TileNode[] {
    // Trier par position x puis y
    const sorted = [...tiles].sort((a, b) => {
        if (a.x !== b.x) return a.x - b.x
        return a.y - b.y
    })

    return sorted.map((tile, index) => {
        const connections: string[] = []

        // Connexion avec la case précédente
        if (index > 0) {
            connections.push(sorted[index - 1].id)
        }

        // Connexion avec la case suivante
        if (index < sorted.length - 1) {
            connections.push(sorted[index + 1].id)
        }

        return { ...tile, connections }
    })
}

/**
 * Trouve le chemin le plus court entre deux cases
 */
export function findShortestPath(startId: string, endId: string, graph: Map<string, TileNode>): PathStep[] | null {
    const visited = new Set<string>()
    const queue: { id: string; path: PathStep[] }[] = []

    const startTile = graph.get(startId)
    if (!startTile) return null

    queue.push({
        id: startId,
        path: [{ tileId: startId, x: startTile.x, y: startTile.y, stepNumber: 0 }],
    })

    while (queue.length > 0) {
        const current = queue.shift()!

        if (current.id === endId) {
            return current.path
        }

        if (visited.has(current.id)) continue
        visited.add(current.id)

        const neighbors = getConnectedTiles(current.id, graph)
        neighbors.forEach((neighbor) => {
            if (!visited.has(neighbor.id)) {
                queue.push({
                    id: neighbor.id,
                    path: [
                        ...current.path,
                        {
                            tileId: neighbor.id,
                            x: neighbor.x,
                            y: neighbor.y,
                            stepNumber: current.path.length,
                        },
                    ],
                })
            }
        })
    }

    return null
}

/**
 * Vérifie si une case est accessible depuis une autre
 */
export function isReachable(fromId: string, toId: string, graph: Map<string, TileNode>): boolean {
    return findShortestPath(fromId, toId, graph) !== null
}
