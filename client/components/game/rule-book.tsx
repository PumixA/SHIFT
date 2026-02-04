"use client"
import { useState, useCallback } from "react"
import { Book, Pencil, Trash2, Plus, Zap, HelpCircle, Play, GripVertical, Search, Filter, ChevronDown, ChevronUp, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Rule, ACTION_INFO, TRIGGER_INFO } from "@/src/types/rules"
import { getRuleDescription } from "@/lib/rule-utils"
import { RULE_TEMPLATES, RULE_CATEGORIES, getRulesByCategory } from "@/lib/rule-templates-extended"

interface RuleBookProps {
  rules: Rule[]
  onEditRule: (rule: Rule) => void
  onDeleteRule: (id: string) => void
  onAddRule: () => void
  onAddRuleFromTemplate?: (rule: Rule) => void
  onReorderRules?: (rules: Rule[]) => void
  disabled?: boolean
}

export function RuleBook({ rules, onEditRule, onDeleteRule, onAddRule, onAddRuleFromTemplate, onReorderRules, disabled = false }: RuleBookProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["movement"])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Filtrer les règles
  const filteredRules = rules.filter(rule => {
    const matchesSearch = searchQuery === "" ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = activeFilters.length === 0 ||
      rule.tags?.some(tag => activeFilters.includes(tag))

    return matchesSearch && matchesFilter
  })

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newRules = [...rules]
      const [removed] = newRules.splice(draggedIndex, 1)
      newRules.splice(dragOverIndex, 0, removed)
      onReorderRules?.(newRules)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    )
  }

  const addFromTemplate = (template: Rule) => {
    const newRule: Rule = {
      ...template,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    onAddRuleFromTemplate?.(newRule)
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const getTriggerName = (rule: Rule) => {
    const triggerType = typeof rule.trigger === 'object' ? rule.trigger.type : rule.trigger
    return TRIGGER_INFO[triggerType]?.name || triggerType
  }

  const getEffectsSummary = (rule: Rule) => {
    return rule.effects.map(e => {
      const info = ACTION_INFO[e.type as keyof typeof ACTION_INFO]
      return info?.name || e.type
    }).join(", ")
  }

  return (
    <div className="w-full h-full lg:h-[calc(100vh-5rem)] border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border bg-background/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-cyan-400" />
            <h2 className="font-bold text-lg">Livre des Règles</h2>
            <Badge variant="secondary" className="text-xs">
              {rules.length} actives
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddRule}
            disabled={disabled}
            className={`h-8 ${disabled ? 'opacity-50 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'}`}
          >
            <Plus className="h-4 w-4 mr-1" />
            Créer
          </Button>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une règle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4" />
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px]">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {RULE_CATEGORIES.map(cat => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  checked={activeFilters.includes(cat.id)}
                  onCheckedChange={() => toggleFilter(cat.id)}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Onglets */}
        <div className="flex gap-2">
          <Button
            variant={!showTemplates ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowTemplates(false)}
            className="h-7 text-xs"
          >
            Règles actives
          </Button>
          <Button
            variant={showTemplates ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowTemplates(true)}
            className="h-7 text-xs"
          >
            Modèles ({RULE_TEMPLATES.length})
          </Button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {!showTemplates ? (
              // Règles actives avec drag and drop
              filteredRules.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-border rounded-lg">
                  <Book className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery || activeFilters.length > 0
                      ? "Aucune règle trouvée"
                      : "Aucune règle active"}
                  </p>
                  <Button variant="link" onClick={() => setShowTemplates(true)} className="text-cyan-400 mt-2">
                    Parcourir les modèles
                  </Button>
                </div>
              ) : (
                filteredRules.map((rule, index) => (
                  <Card
                    key={rule.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={handleDragLeave}
                    className={`bg-secondary/50 border-border hover:border-cyan-400/30 transition-all cursor-move ${
                      dragOverIndex === index ? "border-cyan-400 bg-cyan-400/10" : ""
                    } ${draggedIndex === index ? "opacity-50" : ""}`}
                  >
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <span className="text-cyan-400 font-mono">{String(index + 1).padStart(2, "0")}</span>
                          {rule.title}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            className={`h-6 w-6 ${disabled ? 'opacity-50 cursor-not-allowed' : 'text-muted-foreground hover:text-cyan-400'}`}
                            onClick={() => onEditRule(rule)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            className={`h-6 w-6 ${disabled ? 'opacity-50 cursor-not-allowed' : 'text-muted-foreground hover:text-destructive'}`}
                            onClick={() => onDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                          <Zap className="h-2.5 w-2.5" />
                          {getTriggerName(rule)}
                        </span>
                        {rule.conditions.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-400/10 text-blue-400 border border-blue-400/30">
                            <HelpCircle className="h-2.5 w-2.5" />
                            {rule.conditions.length} condition{rule.conditions.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-400/10 text-green-400 border border-green-400/30">
                          <Play className="h-2.5 w-2.5" />
                          {rule.effects.length} effet{rule.effects.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {rule.description || getEffectsSummary(rule)}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )
            ) : (
              // Modèles de règles
              RULE_CATEGORIES.map(category => {
                const categoryRules = getRulesByCategory(category.id)
                if (categoryRules.length === 0) return null

                const filteredCategoryRules = categoryRules.filter(rule =>
                  searchQuery === "" ||
                  rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  rule.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )

                if (filteredCategoryRules.length === 0) return null

                return (
                  <Collapsible
                    key={category.id}
                    open={expandedCategories.includes(category.id)}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              {category.name}
                              <Badge variant="secondary" className="text-[10px]">
                                {filteredCategoryRules.length}
                              </Badge>
                            </span>
                            {expandedCategories.includes(category.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      {filteredCategoryRules.map(template => (
                        <Card
                          key={template.id}
                          className="bg-secondary/30 border-border/50 hover:border-cyan-400/30 transition-colors ml-4"
                        >
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{template.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {template.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={disabled}
                              className={`h-8 ${disabled ? 'opacity-50 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'}`}
                              onClick={() => addFromTemplate(template)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Utiliser
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-border text-center bg-background/50">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          Glissez-déposez pour réorganiser • {RULE_TEMPLATES.length} modèles disponibles
        </p>
      </div>
    </div>
  )
}
