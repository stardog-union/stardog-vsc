```ttl
@base <http://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix rel: <http://www.perceive.net/schemas/relationship/> .

<#green-goblin>
    rel:enemyOf <#spiderman> ;
    a foaf:Person ;    # in the context of the Marvel universe
    foaf:name "Green Goblin" .

<#spiderman>
    rel:enemyOf <#green-goblin> ;
    a foaf:Person ;
    foaf:name "Spiderman", "Человек-паук"@ru .

 foaf:mbox  <mailto:alice@example.org>

# Numbers
5
-5
-5.3
4.2E9
4.2e9

"-5"^^xsd:integer
"-5.0"^^xsd:decimal
"4.2E9"^^xsd:double
```

```trig
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

# default graph - no {} used.
<http://example.org/bob> dc:publisher "Bob" .
<http://example.org/alice> dc:publisher "Alice" .

# GRAPH keyword to highlight a named graph
# Abbreviation of triples using ;
GRAPH <http://example.org/bob>
{
   [] foaf:name "Bob" ;
      foaf:mbox <mailto:bob@oldcorp.example.org> ;
      foaf:knows _:b .
}

GRAPH <http://example.org/alice>
{
    _:b foaf:name "Alice" ;
        foaf:mbox <mailto:alice@work.example.org>
}
```

```sparql
PREFIX a: <http://www.w3.org/2000/10/annotation-ns#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Comment!

SELECT ?given ?family
WHERE {
  {
    ?annot a:annotates <http://www.w3.org/TR/rdf-sparql-query/> .
    ?annot dc:creator ?c .
    OPTIONAL {?c foaf:givenName ?given ;
                 foaf:familyName ?family }
  } UNION {
    ?c !foaf:knows/foaf:knows? ?thing.
    ?thing
  } MINUS {
    ?thing rdfs:label "剛柔流"@jp
  }
  FILTER isBlank(?c)
}

#TEST of SPARQL syntax highlighting comment

PREFIX data: <http://example.com/foaf/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

prefix:relatedTo :Thing
prefix:relatedTo [ a :Thing];

SELECT ?mbox ?nick ?ppd
FROM NAMED <http://example.org/foaf/aliceFoaf>
FROM NAMED <http://example.org/foaf/bobFoaf>
WHERE
{
  GRAPH data:aliceFoaf
  {
    ?alice  foaf:mbox <mailto:alice@work.example>;
            foaf:knows ?whom .
    ?whom   foaf:mbox ?mbox ;
            rdfs:seeAlso ?ppd .
    ?ppd    a foaf:PersonaProfileDocument .
  } .
  GRAPH ?ppd
  {
    ?w  foaf:mbox ?mbox ;
        foaf:nick ?nick
  }
}

SELECT ?test
FROM NAMED <http://something.com/rdf/thing>;

'''The librarian said, "Perhaps you would enjoy 'War and Peace'."'''
'chat'@fr
1.0e6
true
false
"1.300"^^xsd:decimal

SELECT ?P (COUNT(?O) AS ?C)
WHERE { ?S ?P ?O }
GROUP BY ?P
HAVING (COUNT(?O) > 2 )
```

```shacl
ex:PersonShape
	a sh:NodeShape ;
	sh:targetClass ex:Person ;    # Applies to all persons
	sh:property [                 # _:b1
		sh:path ex:ssn ;           # constrains the values of ex:ssn
		sh:maxCount 1 ;
		sh:datatype xsd:string ;
		sh:pattern "^\\d{3}-\\d{2}-\\d{4}$" ;
	] ;
	sh:property [                 # _:b2
		sh:path ex:worksFor ;
		sh:class ex:Company ;
		sh:nodeKind sh:IRI ;
	] ;
	sh:closed true ;
	sh:ignoredProperties ( rdf:type ) .
```

