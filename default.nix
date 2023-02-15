{ pkgs ? import <nixpkgs> { }}:

with pkgs;
stdenv.mkDerivation {
  pname = "all-gnome-backgrounds";
  version = "0.0.0";

  src = ./.;

  nativeBuildInputs = [
     imagemagickBig moreutils jq librsvg git libjxl gnumake perl findimagedupes perl536Packages.XMLXPath
  ];

  buildInputs = [

  ];

  installPhase = ''
    mkdir -p $out
    cp -r data/* $out
  '';
}