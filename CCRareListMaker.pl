#!/bin/perl
# make ConCon Rare List from [狐魂一覧](https://c4.concon-collector.com/help/alllist)

use strict;
use warnings;
use utf8;
use Encode;
use LWP::Simple qw(mirror);
use Path::Class qw(file dir);
use YAML::Syck qw(LoadFile Dump DumpFile);
use JSON::XS;
use HTML::Template;
use FindBin::libs;
use RareCC;
use Term::Encoding qw(term_encoding);
use open ':std' => ':locale';

$YAML::Syck::ImplicitUnicode = 1;

my $dirBase = $FindBin::RealBin . '/';
my $conf    = LoadFile( $dirBase . 'conf.yml' ) or die("conf.yml: $!");
@RareCC::Forces       = @{ $conf->{'Forces'} };
@RareCC::Types        = @{ $conf->{'Types'} };
@RareCC::TableHeaders = @{ $conf->{'TableHeaders'} };
$RareCC::UriViewBase  = $conf->{'UriViewBase'};
$RareCC::templateLink
    = HTML::Template->new( scalarref => \( removeSpace( $conf->{'templateLink'} ) ) );
$RareCC::UriIconBase = $conf->{'UriIconBase'};
$RareCC::templateIconLink
    = HTML::Template->new( scalarref => \( removeSpace( $conf->{'templateIconLink'} ) ) );

$RareCC::cards            = Cards->new( db => 'db.yml' );
@RareCCs::TableHeaders    = @{ $conf->{'TableHeaders'} };
$RareCCs::NumOfFurMin     = $conf->{'NumOfFurMin'};
@Lot::Types               = @{ $conf->{'Types'} };
$LogGroups::NumOfLotGroup = $conf->{'NumOfLotGroup'};
my $pathAllList = $dirBase . 'data/AllList.json';
my $code        = mirror( $conf->{'UriAllList'}, $pathAllList );
chmod( 0666, $pathAllList );
my $json        = JSON::XS->new->utf8(0);
my $fileAllList = file($pathAllList);
my $textAllList = $fileAllList->slurp( iomode => '<:utf8' );
$textAllList =~ s/\x{feff}//g;
my $allList = $json->decode($textAllList);

my $rares       = RareCCs->new()->addList($allList);
my $lots        = Lots->new()->addRareCCs($rares);
my $lotGroups   = LogGroups->new()->divideLots($lots);
my $pathRareCCs = $dirBase . 'data/RareCCs.yml';
DumpFile( $pathRareCCs, $lotGroups );
chmod( 0666, $pathRareCCs );

my $dirHtml      = dir( $dirBase . 'html' );
my @contentIndex = ();
my $templateLot  = HTML::Template->new( filename => $dirBase . 'templateLot.html', utf8 => 1, );
foreach my $group ( sort { $a <=> $b } ( keys( %{$lotGroups} ) ) ) {
    push( @contentIndex, { link => "${group}.html", label => $lotGroups->{$group}->getTitle } );
    $templateLot->param( page_title => $lotGroups->{$group}->getTitle );
    $templateLot->param( toc        => $lotGroups->{$group}->getToc );
    $templateLot->param( lots       => $lotGroups->{$group}->getLots );
    $dirHtml->file("${group}.html")->spew( iomode => '>:utf8', $templateLot->output );
}
push( @contentIndex, { link => "byFurs.html", label => $conf->{'NumOfFurBasePage'} } );
my $templateByFurs
    = HTML::Template->new( filename => $dirBase . 'templateByFurs.html', utf8 => 1, );
$templateByFurs->param(
    rare_headers => $rares->getTableHeaders,
    rares        => $rares->getTableBody( byFurs => 1 ),
);
$dirHtml->file("byFurs.html")->spew( iomode => '>:utf8', $templateByFurs->output );
my $templateIndex = HTML::Template->new( filename => $dirBase . 'templateIndex.html', utf8 => 1, );
$templateIndex->param( toc => [@contentIndex] );
$dirHtml->file("index.html")->spew( iomode => '>:utf8', $templateIndex->output );

print "Content-type: text/plain\n\nFinish.\n";

sub removeSpace {
    my $html = shift or return;
    $html =~ s/>\s+</></g;
    return $html;
}

# EOF

